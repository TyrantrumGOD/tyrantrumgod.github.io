# Shiny Hunt Tracker

A simple web-based tool to track your shiny Pokémon encounters.

## Features

* **Pokémon Selection:** Choose the Pokémon you are currently hunting from a dropdown list.
* **Hunting Method Selection:** Select the method you are using (e.g., Encounters, Masuda Method, Full Odds). This helps in displaying relevant shiny odds.
* **Shiny Charm Tracking:** Indicate if you have the Shiny Charm to see the adjusted odds.
* **Shiny Odds Display:** Dynamically displays the shiny encounter odds based on the selected method and whether you have the Shiny Charm.
* **Encounter Counter:** Simple increment, decrement, and reset buttons to keep track of your encounter count.
* **Pokémon Image:** Displays an image of the selected Pokémon.
* **Notes:** A textarea to add any notes or details about your current hunt.
* **Download Hunt Data:** A button to download the details of your completed hunt as a JSON file. This includes:
    * Start time of the hunt (if tracked).
    * End time of the hunt.
    * Date of the hunt.
    * The Pokémon being hunted.
    * The hunting method used.
    * Whether the Shiny Charm was active.
    * The final encounter count.
    * Any notes you added.
* **Local Storage:** Saves your current progress (encounter count, selected Pokémon, method, Shiny Charm status) in your browser's local storage, so your hunt persists across page reloads.

## How to Use

1.  **Open `index.html`** in your web browser.
2.  **Select the Pokémon** you are hunting from the "Hunting:" dropdown.
3.  **Choose your hunting method** from the "Method:" dropdown.
4.  **Check the "Have Shiny Charm?" box** if you have the Shiny Charm.
5.  **Use the "Increment" button** each time you encounter the Pokémon.
6.  **Use the "Decrement" button** if you miscounted.
7.  **Use the "Reset" button** to start a new hunt for the same Pokémon or a different one.
8.  **Add any relevant notes** in the "Add any notes about this hunt" textarea.
9.  **Once you find your shiny Pokémon**, click the "Finish Hunt and Download Data" button to save a record of your hunt as a `.json` file.

## Files Included

* `index.html`: The main HTML file containing the structure of the tracker.
* `style.css`: The CSS file responsible for the styling of the tracker.
* `script.js`: The JavaScript file containing the logic and functionality of the tracker.

## Setup (Local Use)

No special setup is required. Simply download or create the `index.html`, `style.css`, and `script.js` files in the same directory on your computer and open `index.html` in your web browser.

## Contributing

If you'd like to contribute to this project, feel free to fork the repository and submit a pull request with your changes.

## License

This project is open-source and available under the [Specify License Here] license.

## Acknowledgements

* PokeAPI for Pokémon images

---

Enjoy your shiny hunting!
