@echo off
title AutoControl - Servidor y App
echo Iniciando sistema AutoControl...

:: Entra a la ruta de tu proyecto
cd "C:\Users\zombi\OneDrive\Escritorio\Estadias-Automate"

:: Abre el navegador predeterminado en tu IP
start opera --start-fullscreen "http://192.168.1.253:5173"

:: El comando "call" evita que npm cierre la ventana al terminar de cargar
call npm start

:: Esto mantendrá la ventana abierta por si hay algun error
pause