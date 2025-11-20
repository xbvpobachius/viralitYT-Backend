# ViralitYT Mobile App

App móvil para iPhone con diseño profesional estilo Apple, basada en los wireframes proporcionados.

## Características

- ✅ Splash Screen estilo Netflix con "V" roja
- ✅ Pantalla de Onboarding
- ✅ Login/Sign In
- ✅ Dashboard con métricas
- ✅ Calendario de programación
- ✅ Gestión de canales
- ✅ Diseño estilo Apple (SF Pro, colores limpios, espaciado generoso)

## Instalación

```bash
# Instalar dependencias
npm install

# Iniciar en iOS
npm run ios

# O con Expo CLI
expo start --ios
```

## Estructura

```
mobile-app/
├── src/
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── OnboardingScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── DashboardScreen.tsx
│   │   ├── CalendarScreen.tsx
│   │   └── AddChannelScreen.tsx
│   └── navigation/
│       └── MainTabs.tsx
├── App.tsx
└── package.json
```

## Diseño

- **Colores**: Negro (#000000) y Rojo Netflix (#E50914)
- **Tipografía**: SF Pro (sistema iOS)
- **Estilo**: Minimalista, profesional, estilo Apple

## Próximos pasos

1. Conectar con API backend
2. Implementar autenticación real
3. Agregar más funcionalidades según wireframes
4. Optimizar rendimiento
5. Agregar animaciones suaves

