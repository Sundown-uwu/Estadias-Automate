#!/bin/zsh

# Título de la ventana de la Terminal
echo -e "\033]0;AutoControl - Servidor y App\007"

echo "Iniciando sistema AutoControl..."

# Cambia a la ruta de tu proyecto en Mac
# Si tu usuario o carpeta cambian, ajusta la ruta aquí ($HOME apunta a tu carpeta de usuario)
cd "$HOME/Desktop/Estadias-Automate"

# Abre Google Chrome en pantalla completa
open -a "Google Chrome" --args --start-fullscreen "http://192.168.1.253:5173"

# Si prefieres Safari, puedes usar esta línea en su lugar:
# open -a "Safari" "http://192.168.1.253:5173"

# Ejecuta el servidor Node
npm start

# Pausa al final si ocurre algún error o se detiene el proceso
echo ""
read "?Presiona Enter para cerrar..."