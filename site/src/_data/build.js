// VORSCHAU=1 baut die Vorschau-Fassung: Formulare schicken nichts ab, und
// die Startseite heißt index.html statt "./".
export default {
  vorschau: process.env.VORSCHAU === "1",
};
