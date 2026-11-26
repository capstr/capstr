# Capstr
## A free,open-source captioning option for live theatre

<img width="1157" height="991" alt="capstr screenshot" src="https://github.com/user-attachments/assets/9d9b3d26-a4e6-433b-bba5-cebc3489b09b" />

## Mission

Capstr is designed to reduce barriers to access to theatre for d/Deaf and Hard-of-Hearing audiences and to provide easy options for theatres to provide a bring-your-own device closed captioning solution.

By removing the cost barrier, we hope that venues of all sizes that may not have previously had the the resources can now provide captioning to all of their audiences - in all of their shows.

It **does not** and **should not** replace commitments to integrated access, such as integrated / creative captioning. which is an artistic tool in its own right. Research has routinely shown that d/Deaf audiences prefer open captions that are integrated into the scenery to closed ones. ***As such, capstr also provides functionality to send captions over osc to programs like Isadora where they can be formatted and integrated into a wider video deisgn for the show, while still enabling the operator to use a control surface specifically deisgned for captioning.***

Currently, capstr still requires a human operator to follow the show. We are interested in expanding capstr's functionality to allow for auto-following and/or some auto-transcription at some point in the future, but believe this must be done with a significant amount of care.

Captioning is an art in itself - where to break lines, the time each caption is cued at, how those captions appear (and what that communicates to an audience member about that character / line of dialog), and even what is or isn't captioned are dramaturgical choices and should be treated as such - and these creative choices should ideally be made by humans.

***Any and all future AI integrations into capstr will be designed to be able to be run locally, using free open-source models, and be completely optional.***

## Installation

Please download the latest version from Releases.

### Mac Installation
Download the dmg and move capstr into your Applications folder.
As the app is unsigned, so you will likely encounter a popup telling you that it cannot be opened. This can be bypassed by going to your Mac's system **Settings>Privacy & Security**, scrolling down and allowing capstr. It should then open.

### *Windows build coming soon*

## Boot Screen
The first thing you will see when capstr opens is the boot screen, which asks you to select a network adapter, choose a network port and a serial port.

<img width="612" height="712" alt="SCR-20261125-pkzg" src="https://github.com/user-attachments/assets/97bdf64e-67e4-4baa-bef7-efccf0cc0adf" />


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

## Characters

After importing a xlsx or a .capstr showfile, under **Setup>Character** you can select a display color for each detected character. 

Capstr will update this list as lines are edited in the main operator menu in edit mode.

<img width="1157" height="991" alt="SCR-20261125-pjan" src="https://github.com/user-attachments/assets/5acc1df9-a2c1-4be0-a683-08e76da60db5" />

## Linetypes

Each caption has a "linetype" associated with it, populated from the type column in your xlsx file on import. 

Linetypes can be named anything you want - but the type "title" is special as it will cause the character name in that caption to not be imported into the character list.

Linetypes present in the showfile are listed on the Setup > Linetypes page. here you can select formatting styles and text-decoration to help indicate the different things those captions might be representing. For example a line sing by a character in a show might use a "sung" linetype which wraps the text in musical notes, while a "music" linetype might indicate a song playing over the speakers and utilise both the musical notes and italics / square brackets.

<img width="1157" height="991" alt="SCR-20261125-pjds" src="https://github.com/user-attachments/assets/bec34ae1-534c-4e71-a7b1-a689ecb121ae" />

*Each caption can be reassigned to a different linetype using the dropdown list next to it in the main operator view.*

## Operation

The main operator window is where you actually run the show from.

<img width="1157" height="991" alt="capstr screenshot" src="https://github.com/user-attachments/assets/a30ff1c5-abc9-4e63-9969-118eccf32de5" />

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

## Viewing Captions

For audiences, capstr works entirely in-browser, there are no apps needed to be downloaded.

For ease, we highly recommend providing audience members with both a QR code and a url they can use to access the caption page in their phone browsers.

This should point to either *capstr.local:{port}*, *{ip address}:{port}*, or your *webserver url*.

### The user experience

Once on this page, users are greeted by an information page that tells them to silence their phones and dim their brightness - and to be courteous and not distract others by using their phones to do other things liek respond to texts or emails or scroll social media.

<img width="570" height="999" alt="SCR-20261125-pjke" src="https://github.com/user-attachments/assets/d977c9f1-e364-490c-8426-e9ae48f665cc" />


After they hit proceed, they see a welcome text that includes the venue and show name you set up in **setup > venue / show info**. 

Captions will appear on this page when the show is running and the operator starts cueing them.

With the settings icon in the top right, audiences can choose a typeface from the bundled selection (a generic sans-serif, times new roman, comic sans and open dyslexic), adjust their font size, turn on or off the per-character color coding, and choose if they would like to see a ghost version of the previous two captions (in case they missed them ):

<img width="472" height="343" alt="SCR-20261125-pjws" src="https://github.com/user-attachments/assets/aae7c638-6ed5-4730-92f6-35b2f68bf187" />
<img width="560" height="1064" alt="SCR-20261125-pjqq" src="https://github.com/user-attachments/assets/332403a2-7bad-4ab4-86e5-5851c18476c8" />

*Currently, capstr works best with phones in portrait mode - a future update will work on optimizing the experience in landscape*

## Editing Captions

In the main operator window, you will see an edit button and a delete button by each caption. 

<img width="993" height="60" alt="SCR-20261125-pkgb" src="https://github.com/user-attachments/assets/c7d94389-62b7-4367-920c-d96beb677bd7" />

As well as editing the text, you can also split a caption into multiple lines by using the **split** button, this will split the caption at wherever the text cursor is in the line.
*(For bilingual capstr showfiles, split will split the current line in the primary language and just duplicate it in the secondary languages - you can go back and edit those by switching primary language in setup)*

*WARNING: Edits in operator mode auto-save - so this action is not undoable. A future version of capstr will add in undo functionality.*

**Delete** removes that entire caption from the showfile.
Edit opens edit mode where you can edit the text in both the character box and the dialog box:

<img width="1003" height="55" alt="SCR-20261125-pkee" src="https://github.com/user-attachments/assets/950b2937-dadc-4f7c-8138-46df3ddad5ab" />


To edit the dialog of one of the other languages in your showfile, you must set that langauge as primary in **Setup>Show / Venue Info**, then you will see that language track in your operator view.

*Please note that changing the primary language also sets what language audience members recieve by default, unless they have specifically set a language preference in their own settings. A future version of capstr will simplify this process.*

## Sending captions to an external monitor

You can use capstr to drive captions on an external display like a tv screen or projector, by opening the **Monitor** window, moving it on to that external display and going into Full-Screen mode by hitting **F** on the keyboard. (Hitting F again restores windowed mode.)

*You can edit font choice, size and language choice with the settings icon that appears upon hovering in the top right corner.*

*NOTE: On Mac, this functionality requires **"Displays have seperate spaces"** to be enabled in your system **Settings > Desktop & Dock***

# Web App

As well as accessing the live caption through the local network at capstr.local:{port}, you can set capstr up to send captions out to a web-hosted server that you can host yourself for a small fee on services like **Heroku** or **Render.com**

### Why use the web server vs just the local version?

Capstr is designed for maximum flexibility and ease of use for both venues and audiences. While a locally-hosted version of capstr is both free and much more within your control, there is potential friction for the user as they have to join your wifi network. For non tech-savvy customers, the burden of assiting with this falls to an already busy FoH team.

That said, if your venue has spotty cellular coverage - or you wish to use capstr on venue-provided devices rather than audience members' own, the local version may well be your best best. Although every attempt has been made to simplify this process as much as humanly possible, the web server version also does require slightly more technical prowess to set up than the purely local one - especially if you wish to use a custom web address like *www.{yourvenuename}-capstr.com*.


## 1-click webserver setup:

You can set up the webserver on Heroku or Render.com using these 1-click buttons that deploy it for you. Other services are available and will work, but are currently untested.

To set this up, you will need to set a secret key called "SECRET_KEY" in your environment variables - you may be asked for this / to generate this on the main setup screen of your host of choice - or you may have to find it in your environment settings. 

Choose or generate a secure, random string as your secret key, and note it securely for safe keeping.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://www.heroku.com/deploy?template=https://github.com/therealjimjelly/capstr)


### Connecting to capstr

Back in Capstr, under Setup > Web, you can paste in your secret key and the url of your webserver (i.e. the page your webserver appears on - for render.com, this is something like *https://capstr-web-jl6n.onrender.com*), and click **set url** and **set scret key**.

Your captions should now appear on the webpage as you send them, as well as on the local version.

To map a different web address to your capstr webserver, purchase the domain you want and see your host's docuemntation on 

***If/when you update capstr at any point, it is a good idea to re-deploy to your webserver, to ensure compatibility continues (future capstr updates may break the connection with older versions of the webserver).***



## Thanks & credits

Capstr was created by Timothy Kelly and Peter Leibold.

It was created with the kind support of:

- The University of Maryland School of Theatre, Dance, and Performance Studies
- Oregon State University School of Visual, Performing, and Design Arts
- Andy's Summer Playhouse, New Hampshire
