/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#131417",
        paper: "#F6F2EA",
        parchment: "#EAE3D6",
        lime: "#B7FF3C",
        electric: "#2E6BFF",
        coral: "#FF6B5E",
        graphite: "#1F1F1F",
      },
    },
  },
  plugins: [],
};
