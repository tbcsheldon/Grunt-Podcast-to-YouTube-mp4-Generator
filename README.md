# README #

This Grunt script will take any numbers of pictures and a single mp3 file and create a mp4 file with the images appearing at evenly spaced intervals.

### What is going on here? ###
Lets say you have an audio podcast and you want an easy way to get on YouTube. Grab some relevant jpg/jpeg images and a relevant mp3. Lets say you have 3 images from a 60 minute podcast. This script will count the number of images (3), divide the length of the mp3 (60) by that number (3) returning the interval number (20). Video files using each image are created with a duration of the interval number (20). When these files finish generating they are glued togeher to create an mp4 file the exact length of the source mp3 (60). The joined mp4 (60) and source mp3 (60) are glued together to create the final product, a YouTube optimized mp4 with a photo slideshow. Now get on YouTube and monatize your content!


### What is required? ###

* ffmpeg
* Graphicsmagick/Imagemagick
* Grunt

### How do I get set up? ###

* Clone this repository onto your machine
* Run 'npm install' as a safety measure before your first run. This will only have to be done once.
* In the root folder you will find an 'episodes' folder. Create a new folder inside 'episodes' for the podcast you wish to encode. Keep it simple like a number, 142 for example.
* Place all your jpg/jpeg images (name your files 100.jpg, 101.jpg etc to easily control the order in which they appear) and podcast mp3 file into the new folder you just created, in this case '142'
* Due to the nature of the code structure the commands have to be run seperately and in order. Trying to create a grunt task that run them in order hs always resulted in errors.
* 1: grunt resize
* 2: grunt encode
* 3: grunt concat

Thats it. The video will be in the 'output' folder in the original folder and with the same filename as the mp3 except now it is an mp4. The file is encoded with YouTube in mind @ 720p quality. Videos upload and process quickly with these setting in my expereince.

