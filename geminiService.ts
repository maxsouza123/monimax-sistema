
import { GoogleGenAI } from "@google/genai";
import { SecurityEvent } from "./types";

// Função utilitária para pausar a execução
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Função de execução com Retry (Backoff Exponencial)
async function fetchWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      // Verifica se é erro de cota (429) ou erro de servidor (5xx)
      if (error?.status === 429 || (error?.status >= 500 && error?.status < 600)) {
        const waitTime = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.warn(`Gemini API: Erro ${error.status}. Tentando novamente em ${Math.round(waitTime)}ms...`);
        await sleep(waitTime);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
}

export const getSecurityInsights = async (events: SecurityEvent[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const callApi = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analise os seguintes eventos de segurança e forneça um resumo executivo em português com recomendações acionáveis:
      ${JSON.stringify(events.map(e => ({ type: e.type, desc: e.description, loc: e.location })))}`,
      config: {
        systemInstruction: "Você é um analista de segurança sênior experiente. Seja direto, profissional e focado em riscos críticos.",
      },
    });
    return response.text;
  };

  try {
    return await fetchWithRetry(callApi);
  } catch (error: any) {
    console.error("Erro final ao buscar insights do Gemini:", error);
    if (error?.status === 429) {
      return "QUOTA_EXCEEDED";
    }
    return "Erro ao gerar análise automatizada.";
  }
};

export const summarizeIncident = async (event: SecurityEvent) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

  const callApi = async () => {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Resuma o incidente ${event.type} ocorrido em ${event.location} às ${event.timestamp}. Descrição: ${event.description}. Forneça os próximos passos para o operador.`,
      config: {
        systemInstruction: "Responda em um parágrafo curto e direto em português.",
      }
    });
    return response.text;
  };

  try {
    return await fetchWithRetry(callApi);
  } catch (error: any) {
    if (error?.status === 429) return "LIMITE_COTA";
    return "Erro ao resumir incidente.";
  }
};
