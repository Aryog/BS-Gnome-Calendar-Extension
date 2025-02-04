# Nepali Calendar Gnome Shell Extension
This is a gnome shell extension that shows Nepali calendar in the top bar of Gnome Shell. 



## Installation

 [![Install on GNOME Shell](https://pbs.twimg.com/media/D6s8OS2U8AAaLNQ.png)](https://extensions.gnome.org/extension/7490/nepali-calendar/)



## Manual Installation
1. Clone this repository.
   ```bash
    git clone git@github.com:PublisherName/nepali-calendar-gs-extension.git
    ```

2. Change directory to the cloned repository.
    ```bash
    cd nepali-calendar-gs-extension
    ```
3. Run the following command to install the extension.
    ```bash
    ./install.sh
    ```
4. Restart Gnome Shell.
    ```bash
    Alt + F2
    r
    ```
5. Enable the extension using Gnome Tweaks or Extensions application.

## Usage
The extension shows the current Nepali date in the top bar of Gnome Shell. Clicking on the date will show the Nepali date and event for the current day.

# Code Formatting with ESLint and Prettier

This project uses ESLint and Prettier to enforce consistent code formatting and style conventions, including single quotes and 2-space indentation.

- Install esling and prettier

    ```npm install eslint eslint-plugin-prettier```

- Run eslint

    ```npx eslint . --fix```


## License
This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](LICENSE) file for details.

After installation:
- If you're using X11: Press Alt+F2, type 'r', and press Enter
- If you're using Wayland: Log out and log back in

### From GNOME Extensions Website
*(Coming soon)*

Visit [GNOME Extensions](https://extensions.gnome.org) and search for "Nepali Calendar"

## Configuration

You can configure the extension using GNOME Extensions Settings:
1. Open GNOME Extensions app
2. Find "Nepali Calendar" in the list
3. Click the settings icon to:
   - Change the position of the date in the top panel
   - Customize other preferences

## Development

To contribute to the development:

### Building from Source
