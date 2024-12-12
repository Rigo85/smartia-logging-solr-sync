
# Desplegar en PM2
- Instalar PM2.
- Clonar el repo *https://github.com/Rigo85/smartia-logging-solr-sync.git*.
- Moverse a *smartia-logging-solr-sync*.
- Construir: `npm run build`.
- Iniciar: `pm2 start dist/server.js --name smartia-logging-solr-syc --log /home/azureuser/smartia-logging-solr-sync.log --time`

