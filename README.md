

# Abejorro Digital Color

### Ingeniería de Color y Extracción Cromática para Sistemas de Diseño Modernos

**Abejorro Digital Color** es una solución avanzada de software diseñada para transformar recursos visuales en activos técnicos accionables. Esta aplicación permite la extracción automatizada de paletas cromáticas a partir de imágenes, integrando algoritmos de visión computacional y manipulación en espacios de color perceptualmente uniformes para garantizar la coherencia visual en flujos de trabajo de ingeniería frontend.

---

## 🐝 Filosofía del Sistema

La plataforma nace de la necesidad de cerrar la brecha entre la inspiración visual y la implementación de sistemas de diseño. A diferencia de las herramientas de color convencionales, Abejorro prioriza la interoperabilidad y la precisión técnica, generando artefactos de código (CSS, JSON) listos para producción.

## 🚀 Funcionalidades Principales

### 1. Motor de Ingesta Inteligente

El sistema implementa un flujo de datos asíncrono que permite capturar recursos mediante tres vías:

* **Carga Directa:** Validación estricta de tipos MIME (JPEG, PNG, WebP).
* **Drag & Drop:** Zona reactiva basada en la API de arrastre de HTML5.
* **Paste Global:** Captura instantánea desde el portapapeles mediante eventos de sistema.

### 2. Algoritmos de Extracción y Variación

Utilizando la **Canvas API** y técnicas de cuantización, la aplicación identifica los 5 clústeres cromáticos dominantes. A partir de esta base, el motor genera derivaciones automáticas basadas en armonías matemáticas:

* **Armonías:** Análogos, Tríadas y Complementarios.
* **Transformaciones:** Ajustes de luminancia (Shades) y desaturación controlada (Tones).

### 3. Manipulación Perceptual

Los controles de ajuste (Brillo, Saturación y Calidez) operan bajo una lógica de transformación de color que evita la distorsión de la luminosidad percibida, asegurando que cada modificación mantenga la integridad estética del color original.

### 4. Entorno de Validación UI

La aplicación incluye un catálogo de componentes dinámicos para previsualizar la paleta en tiempo real sobre:

* Botones (estados hover y active).
* Tarjetas con jerarquía de elevación.
* Formularios y sistemas de navegación.
* Validación de contraste bajo estándares **WCAG**.

---

## 🛠 Stack Tecnológico

* **Core:** React (Functional Components & Hooks).
* **Estilizado:** Tailwind CSS (Arquitectura basada en utilidades).
* **Procesamiento:** Vanilla JavaScript para lógica de clústeres y manipulación de píxeles.
* **Persistencia Stateless:** Serialización de paletas mediante parámetros de URL para compartición inmediata.

---

## 📥 Exportación y Salida de Datos

Abejorro Digital Color automatiza la generación de entregables técnicos:

1. **CSS Variable System:** Generación de un archivo `colores.css` con variables personalizadas y clases de utilidad.
2. **Visual Assets:** Exportación en formato PNG y SVG (con metadatos cromáticos incluidos).
3. **Collaborative Links:** URLs únicas que contienen el estado completo de la paleta.

---

## 📖 Documentación Técnica

Todo el código fuente ha sido documentado siguiendo el estándar **JSDoc**, especificando tipos de datos, parámetros y la lógica matemática detrás de cada transformación cromática. Esto facilita la escalabilidad del proyecto y su integración en equipos de desarrollo profesionales.

```javascript
/**
 * Calcula la variante complementaria de un color dado.
 * @param {string} hex - El valor hexadecimal del color base.
 * @returns {string} El valor hexadecimal del color diametralmente opuesto.
 */

```

---

## 📄 Licencia

Este proyecto se distribuye bajo la licencia MIT. Siéntete libre de utilizarlo, modificarlo y contribuir a su evolución.

---
