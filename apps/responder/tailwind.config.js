/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#0A3D62",
        accent: "#1ABC9C",
        background: "#F8F8F8",
        "background-dark": "#0f172a",
        neutral: "#2C3E50",
        clear: "#2ECC71",
        partial: "#F39C12",
        blocked: "#E74C3C",
      },
      // RN has no font synthesis — weights map to loaded Poppins fonts.
      // Usage: font-poppins, font-poppins-medium, font-poppins-semibold,
      //        font-poppins-bold, font-poppins-black
      fontFamily: {
        poppins: ["Poppins_400Regular"],
        "poppins-medium": ["Poppins_500Medium"],
        "poppins-semibold": ["Poppins_600SemiBold"],
        "poppins-bold": ["Poppins_700Bold"],
        "poppins-black": ["Poppins_900Black"],
      },
    },
  },
  plugins: [],
};
