# Capstr
## A free,open-source captioning option for live theatre

## 1-click webserver setup:

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/therealjimjelly/capstr)

## Installation

Please download the latest version from Releases.

### Mac Installation
Download the dmg and move capstr into your Applications folder.
As the app is unsigned, so you will likely encounter a popup telling you that it cannot be opened. This can be bypassed by going to your Mac's system **Settings>Privacy & Security**, scrolling down and allowing capstr. It should then open.

### Windows build coming soon

## Boot Screen
The first thing you will see when capstr opens is the boot screen, which asks you to select a network adapter, choose a network port and a serial port.

The network port defaults to 3001, but you can choose whatever you want.

The network adapter choice currently dictates which of your computer's networks capstr will use to:
- run the local capstr server that audiences on your local network can acccess at **capstr.local:{whatever port you chose}**
- communicate with the capstr web server (if you are using that)

## Serial Port Setup (Experimental)

The serial port setup is currently considered experimental. If you have an old-style LED caption board that communicates over serial, you can plug that in and select it here and capstr will also send each caption to it.

*These are pretty hard to come by these days so this functionality has only been tested on one make of caption board. Currently color-coding per character is not supported for serial connections.*

## Importing your caption script

Under **Setup > Showfile**, you can import a caption script in .xlsx format. Capstr auto-detects and creates record for all characters, linetypes and languages present in the script file. 

Use the following format for your caption script.


| character | type | *English | *French |
| --- | --- | --- | --- |
| Mr Blobby | dialog | Hello | Bonjour |
| Scene 2 | title | Subtitle | sous-titre |
| [Offstage] | stage direction | Sound of an alarm | son d’une alarme |


### Important notes on formatting:

- make sure the 'character' and 'type' columns are spelt correctly and lowercase as in the example
- you can have as many language columns for translations as you desire - name these as actual languages they represent but precede them with an asterisk (*), so that capstr knows that these columns are dialog lines
- the character name in any rows with a linetype "title" will be excluded from the character list, so you can put scene numbers in there and subtitles in the dialog columns
- Currently, translations of character names are not supported

## Importing a capstr showfile

You can also import and export pre-made .capstr showfiles from **Setup>Showfile**, which includes all captions as well as linetypea and character formatting

## Character Setup

After importing a xlsx or a .capstr showfile, under **Setup>Character** you can select a display color for each detected character. Capstr will update this list as lines are edited in the main operator menu in edit mode.

## Linetype Setup



## Operation

The main operator window is where you actually run the show from.

### Running and Holding the show
When capstr opens, the show will be **held** by default - this means that no captions are being sent to audience members. To send captions out, make sure the show is in run mode first.

Show status is indicated by the operator window border color (green = running, red = held), and by the status text in the bottom right.

### Cueing captions
In the main window, you see scrollable list of all captions. The currently active caption is indicated by a green border, whereas the caption that is cued up be shown next is blue with a traingle playhead indicator.

You can activate the cued caption by pressing **spacebar**, **down arrow**, or the **next caption** button on screen.
You can go back a caption by pressing **up arrow** or the **previous caption** button on screen.

You can jump to a specific caption by scrolling to it and **left clicking** on it.

**Jump to start** scrolls back to the top and activates the first caption in the stack.

If you have scrolled away from the current active caption, you can bring it back into view by pressing **Recenter on current caption**

### Searching for captions

Pressing **alt** or **option** selects the search field (you can also click on it), where you can type text to search for in the caption stack. Hitting **return** (or clicking search) initiates the search. 
Matches are highlighted in the stack with a light blue outline. You can navigate betwwen matches using **left and right arrows**, or the arrows next to the search button.

### Live Captions

If you need to send a short specific message - perhaps an announcement or an ad-lib, hitting **ctrl** selects the live caption input field. Type a line and hit **return** or click "send" to send the caption to users.

You can send a blank caption with the **Blank** button.

If you have a longer section that needs to be transcribed, open the LiveType window, and there is a larger box to type in. These captions are continuously sent as you type. 
*You could use your computer's dictation feature with this box to live-transcribe speech*

## Editing Captions

In the main operator window, you will see an edit button and a delete button by each caption. 
*WARNING: Edits in operator mode auto-save - so this action is not undoable. A future version of capstr will add in undo functionality.*

**Delete** removes that entire caption from the showfile.
Edit opens edit mode where you can edit the text in both the character box and the dialog box,

To edit the dialog of one of the other languages in your showfile, you must set that langauge as primary in **Setup>Show / Venue Info**, then you will see that language track in your operator view.

*Please note that changing the primary language also sets what language audience members recieve by default, unless they have specifically set a language preference in their own settings. A future version of capstr will simplify this process.*

## Sending captions to an external monitor

You can use capstr to drive captions on an external display like a tv screen or projector, by opening the **Monitor** window, moving it on to that external display and going into Full-Screen mode by hitting **F** on the keyboard. (Hitting F again restores windowed mode.)

*You can edit font choice, size and language choice with the settings icon that appears upon hovering in the top right corner.*

*NOTE: On Mac, this functionality requires **"Displays have seperate spaces"** to be enabled in your system **Settings > Desktop & Dock***