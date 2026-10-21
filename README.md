# J.A.R.V.I.S. nuevo

Aplicación inicial con interfaz futurista, voz del navegador, animación del logo y control horario básico.

## Ejecutar en Windows
1. Instala Node.js 18 o superior desde https://nodejs.org/
2. Extrae la carpeta ZIP.
3. Abre una terminal dentro de la carpeta y ejecuta:
   `npm install`
   `npm start`
4. Abre http://localhost:3000

## Voz
Pulsa el micrófono para dictar. La respuesta se lee en voz alta con la voz disponible en el navegador. El navegador puede pedir permiso para usar el micrófono.

## IA opcional
Copia `.env.example` como `.env` y configura `OPENAI_API_KEY` y opcionalmente `OPENAI_MODEL`.
No compartas el archivo `.env` ni publiques claves en el navegador. Si no configuras la clave, el chat explica cómo seguir.

## Control horario y datos antiguos
Las nuevas marcas se guardan en `data/time-events.json` en el servidor.
Este proyecto NO importa automáticamente los datos antiguos. Antes de migrar, haz una copia de seguridad de la base de datos/almacenamiento antiguo y verifica el formato. Puedes usar el botón Exportar para respaldar las marcas nuevas.
Para producción, configura almacenamiento persistente en Render; el disco local de un servicio web puede no ser persistente entre despliegues si no está configurado.

## Publicar
Configura un nuevo servicio en Render apuntando a esta carpeta/repositorio y configura almacenamiento persistente y variables de entorno. No sustituyas la aplicación antigua hasta validar los datos.
