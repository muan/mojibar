# Mojibar [![Travis CI build status](https://img.shields.io/travis/muan/mojibar.svg)](https://travis-ci.org/muan/mojibar) [![JS Standard Style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard) [![Greenkeeper badge](https://badges.greenkeeper.io/muan/mojibar.svg)](https://greenkeeper.io/)

A menubar app adaptation of [Emoji searcher](http://emoji.muan.co).

![screenshot](https://cloud.githubusercontent.com/assets/1153134/12583324/7756a38a-c485-11e5-9388-3b5c61743905.gif)

## Install

### OSX

#### :triangular_flag_on_post: Download and drag

[Download the latest version for Mac on the releases page](https://github.com/muan/mojibar/releases) (and drag into your apps folder.)

#### :triangular_flag_on_post: Install using [Homebrew Cask](http://caskroom.io/)

```
$ brew cask install mojibar
```

After installation, find Mojibar in your apps folder or search Mojibar in spotlight. Mojibar will appear in your tray at the top right corner of your screen.

### Linux

#### :triangular_flag_on_post: Download and drag

[Download the latest version for Linux on the releases page](https://github.com/muan/mojibar/releases) (and drag into your apps folder.)

You can use it without install any font, but the not all emoji will work, to get all emoji list you can try these approach:

1. **Color** – Follow [these instructions](http://stdio.tumblr.com/post/114082931782)
1. **Black and White** – Download this [emoji font](https://github.com/eosrei/emojione-color-font)

## Usage

<kbd>control + shift + space</kbd><br>
Open app.

<kbd>command/control + ,</kbd><br>
Open preference (while window is open).

<kbd>👆/👇/👈/👉</kbd><br>
Navigate between emojis.

<kbd>enter</kbd><br>
Copy emoji unicode char and exit. For example: `💩`.

<kbd>shift + enter</kbd><br>
Copy emoji code and exit. For example: `:poop:`.

<kbd>space</kbd><br>
Next page.

<kbd>shift + space</kbd><br>
Previous page.

<kbd>/</kbd><br>
Jump to the search field.

<kbd>esc</kbd><br>
Exit.

<kbd>command/control + q</kbd><br>
Quit Mojibar (while window is open).

## Build

:construction:

```
$ git clone https://github.com/muan/mojibar.git
$ cd mojibar
$ npm install
$ npm start
```

## Built with

- [maxogden/menubar](https://github.com/maxogden/menubar)
- [muan/emojilib](https://github.com/muan/emojilib)

## :heart:
