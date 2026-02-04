@echo off
chcp 65001 >nul
set "RTSP_URL=%~1"
set "OUTPUT_PATTERN=%~2"
set "ffmpeg_path=%~dp0ffmpeg.exe"

:: Log para debug
echo [%date% %time%] Iniciando gravacao >> "%~dp0recording_log.txt"
echo RTSP: %RTSP_URL% >> "%~dp0recording_log.txt"
echo OUT: %OUTPUT_PATTERN% >> "%~dp0recording_log.txt"

:: Verifica se a pasta de destino existe
for %%F in ("%OUTPUT_PATTERN%") do set "folder_path=%%~dpF"
if not exist "%folder_path%" (
    echo [%date% %time%] ERRO: Pasta nao encontrada: %folder_path% >> "%~dp0recording_log.txt"
    :: Tenta criar a pasta
    mkdir "%folder_path%" 2>nul
)

:: Executa FFmpeg
"%ffmpeg_path%" -hide_banner -loglevel error -i "%RTSP_URL%" -c:v copy -c:a copy -f segment -segment_time 900 -reset_timestamps 1 -strftime 1 "%OUTPUT_PATTERN%" -c copy -f mpegts pipe:1

if %errorlevel% neq 0 (
    echo [%date% %time%] Erro no FFmpeg: %errorlevel% >> "%~dp0recording_log.txt"
)
