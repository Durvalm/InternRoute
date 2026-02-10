/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/app/**/*.{ts,tsx}", "./src/components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0b0f1a",
        night: "#0f1320",
        mist: "#c7d2fe",
        pop: "#ff6b6b",
        aqua: "#48cae4",
        lime: "#a7f3d0",
        gold: "#f59e0b"
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 19, 32, 0.2)"
      }
    }
  },
  plugins: []
};
