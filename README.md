# SaesNoti

Sistema de consulta y monitoreo del SAES para escuelas del IPN.

## Características

- Multi-campus (UPIITA, UPIICSA, y cualquiera que use la plataforma SAES)
- Sesiones con cache y auto-refresh
- Notificaciones por Telegram cuando suben calificaciones
- Frontend en React para consulta visual

## Stack

- **Backend**: Node.js + Express + TypeScript
- **Frontend**: React + Vite + TypeScript
- **Scraping**: axios + JSDOM
- **Notificaciones**: Telegram Bot API

## Setup

```bash
# Backend
cd backend
npm install
cp .env.example .env  # Configurar variables
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```
