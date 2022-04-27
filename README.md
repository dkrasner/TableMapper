# TableMapper

## Installation

Note: since __TableMapper__ contains a git repo submodule for [sheets](https://github.com/darth-cheney/ap-sheet), use the `git clone --recurse-submodules https://github.com/dkrasner/TableMapper` to clone. (For more on this take a look at the [git submodule docs](https://git-scm.com/book/en/v2/Git-Tools-Submodules)).

Create a node environment like so `nodeenv --node=16.4.2 --prebuilt .nenv` (replace with whatever current version you want, and `.nenv` with the directory you prefer), and activate the environment `source .nenv/bin/activate`. Then run `npm install`.

Note: for emacs magit users the `magit-list-submodules` command will display information about submodules in a new buffer (see the [docs](https://magit.vc/manual/magit/Listing-Submodules.html) for more details). 

## Running

For the moment run a python 3 http server like so `python -m http.server` (in preferably a python environment)and open up `localhost:8000`.

