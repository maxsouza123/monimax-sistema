@echo off
title MoniMax - Servidor de Video (go2rtc)
echo [INFO] Iniciando servidor de video WebRTC...
echo [INFO] Pressione CTRL+C para parar.
echo.
if exist "go2rtc.exe" (
    .\go2rtc.exe
) else (
    echo [ERRO] Arquivo go2rtc.exe nao encontrado na pasta!
    echo Por favor, baixe do link e coloque-o nesta pasta.
    pause
)
