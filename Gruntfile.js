/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    downloadlife: {
      options: {
        
      },
    },
    image_resize: {
      options: {
        width: 350,
        height: 350,
        overwrite: true,
        upscale: true,
      },
    },
    wait: {
      options: {
        delay: 100,
      },
      shell: {
        before : function(options) {
            grunt.log.writeln("pausing..."["yellow"].bold).ok();
        },
        after : function() {
            grunt.log.writeln("continuing..."["yellow"].bold).ok();
        }
      }
    }
  });

  grunt.loadNpmTasks("grunt-then");
  grunt.loadNpmTasks('grunt-downloadfile');
  grunt.loadNpmTasks('grunt-image-resize');
  grunt.loadNpmTasks('grunt-shell');
  grunt.loadNpmTasks('grunt-wait');

  grunt.registerTask('resize', 'find images and resize them', function(action) {

    grunt.task
      .then(function() {
        var images = grunt.file.expand({
          cwd: 'episodes',
          matchBase: true,
        }, ['*.jpg','*.jpeg','*.JPG','*.JPEG','*.jpg.1','*.jpeg.1']);
        // The full path to the current file, which is nothing more than
        // the rootdir + subdir + filename arguments, joined.
        //abspath

        for (var i = 0; i < images.length; i++) {
          var file = images[i].split("/");
          var dir = file[0];
          //console.log(dir);

          if(action=='delete') {
            grunt.config(['shell', 'episode_images_'+i], {
              command: 'rm episodes/'+images[i]
            });
          } else {
            grunt.config(['shell', 'episode_images_'+i], {
              command: 'convert episodes/'+images[i]+' -resize 720X480 -background black -gravity center -quality 100 -extent 720X480 episodes/'+images[i]
            });
          }
        };
      })
      .run("wait")
      .run("shell")
  
  });

  grunt.registerTask('encode', 'do the encoding', function(action) {
    var times = [];
    var audio = grunt.file.expand({
      cwd: 'episodes',
      matchBase: true,
    }, ['*.mp3']);
    var dirs = [];
    var commands = [];
    var concats = [];

    grunt.task
      .then("Working....", function() {

      for (var i = 0; i < audio.length; i++) {
        var file = audio[i].split("/");
        var dir = file[0];

        var images = grunt.file.expand({
          cwd: 'episodes/'+dir,
          matchBase: true,
        }, ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG']).length;

        //console.log(dir+ " " +images);
        var value = {};
        value[dir] = images;
        dirs.push(value[dir]);
        

        grunt.config(['shell', 'find_times_'+i], {
          //command: 'convert episodes/'+images[i]+' -resize 640x360 -background black -gravity center -quality 100 -extent 640x360 episodes/'+images[i]
          command: "ffprobe -i "+audio[i]+" -show_entries format=duration -v quiet -of csv='p=0'",
          options: {
              execOptions: {
                cwd: 'episodes'
              },
              callback: function(err, stdout, stderr, cb) {
                times.push(parseFloat(stdout));

                cb();
              }
          }
        });
      };
    })
    .run("shell")
    .run("wait")
    .then(function() {
      var c = 1;
     
      for (var i = 0; i < times.length; i++) {
        var duration = parseFloat(times[i]/dirs[i]);
        var workingDir = audio[i].split("/")[0];
        var images = grunt.file.expand({
          cwd: 'episodes/'+workingDir,
          matchBase: true,
        }, ['*.jpg', '*.jpeg', '*.JPG', '*.JPEG']);

        if(images.length==1 && grunt.file.exists('episodes/'+audio[i].replace(".mp3", ".mp4"))!=true) {
          grunt.file.mkdir('output/'+workingDir);
          commands.push('ffmpeg -threads 2 -loop 1 -i episodes/'+workingDir+'/'+images[0]+' -i episodes/'+audio[i]+' -c:v libx264 -c:a copy -shortest output/'+audio[i].replace(".mp3", ".mp4"));
          console.log(workingDir+" images:"+images.length+" - "+audio[i]+": Only one image, making video");
        }
        else if(images.length>1 && grunt.file.exists('episodes/'+workingDir+'/out_1.mp4')!=true) {
          for (var ii = 0; ii < images.length; ii++) {
            //grunt.file.mkdir("episodes/"+id[0]); 
            console.log(workingDir+" images:"+images.length+" - "+audio[i]+": Multiple images, making videos");
            commands.push('ffmpeg -threads 2 -loop 1 -i episodes/'+workingDir+'/'+images[ii]+' -c:v libx264 -t '+duration+' episodes/'+workingDir+'/out_'+ii+'.mp4');

            c++;
          }
        }
        else {
          console.log(workingDir+" images:"+images.length+" - "+audio[i]+": Should be all set"['yellow']);
        }
      }
    })
    .then(function() {
      grunt.config(['shell', 'confiles_for_concat'], {
        command: commands.join("&&"),
        options: {
          execOptions: {
            maxBuffer: 30000000000000000000 * 1024
          }
        }
      });
    })
    .run("wait")
    .run("shell:confiles_for_concat");
  });

  grunt.registerTask('concat', '', function() {
    var audio = grunt.file.expand({
      cwd: 'episodes',
      matchBase: true,
    }, ['*.mp3']);
    var cmds = [];
    var encode = [];
    var joins = [];

    grunt.task
      .then(function() {
        var joined = grunt.file.expand({
          cwd: 'episodes',
          matchBase: true,
        }, ['**/joined.mp4']);

        for (var i = 0; i < joined.length; i++) {
          grunt.file.delete('episodes/'+joined[i]);
        }

      })
      .then(function() {
        for (var i = 0; i < audio.length; i++) {
          //console.log(audio[i]);
          var dir = audio[i].split("/")[0];
          //console.log(dir);

          if(grunt.file.exists('episodes/'+dir+'/out_0.mp4')) {
            grunt.config(['shell', 'concat_files_'+i], {
              command: 'printf "file \'%s\'\n" *.mp4 > mylist.txt',
              options: {
                stderr: false,
                execOptions: {
                    cwd: 'episodes/'+dir
                }
              }
            });
          }
        }
      })
      .run("shell")
      .run("wait")
      .then(function() {
        for (var i = 0; i < audio.length; i++) {
          //audio[i]
          var dir = audio[i].split("/")[0];
          var file = audio[i].split("/")[1].replace(".mp3", ".mp4");
          if(grunt.file.exists('episodes/'+dir+'/mylist.txt')){ 
            cmds.push('ffmpeg -y -f concat -i episodes/'+dir+'/mylist.txt -c copy episodes/'+dir+'/joined.mp4');
          
            grunt.file.mkdir('output/'+dir);
            encode.push('ffmpeg -i episodes/'+audio[i]+' -i episodes/'+dir+'/joined.mp4 -acodec copy -vcodec copy output/'+dir+'/'+file);
          
          }
        }
      })
      .then(function() {
        grunt.config(['shell', 'concat'], {
          command: cmds.join("&&"),
          options: {
            execOptions: {
              maxBuffer: 30000000000000000000 * 1024
            }
          }
        });
        grunt.config(['shell', 'encode'], {
          command: encode.join("&&"),
          options: {
            execOptions: {
              maxBuffer: 30000000000000000000 * 1024
            }
          }
        });
      })
      .run("wait")
      .run("shell:concat")
      .run("wait")
      .run("shell:encode");
  });

  grunt.registerTask('upload', '', function() {
    var video = grunt.file.expand({
      cwd: 'output',
      matchBase: true,
    }, ['*.mp4']);

    grunt.task
      .then(function() {
        for (var i = 0; i < video.length; i++) {
          var dir = video[i].split("/")[0];

          var cmd = "youtube-upload --title='Near the Wild, Alaska Podcast #"+dir+" - ' --tags='greg chaille, mat becker, john norris, near the wild podcast, near the wild alaska podcast'  --privacy=private --client-secrets=client_secrets.json output/"+video[i];
          
          console.log("youtube-upload --title='Near the Wild, Alaska Podcast #"+dir+" - ' \
          --tags='greg chaille, mat becker, john norris, near the wild podcast, near the wild alaska podcast' \
          --client-secrets=client_secrets.json --privacy=private output/"+video[i]);

          grunt.config(['shell', 'upload_video_'+dir], {
            command: cmd,
            options: {
              stderr: false
            }
          });
        }
      })
      .run("wait")
      .run("shell");
  });
  

  grunt.registerTask('doit', ['resize', 'wait', 'encode', 'wait', 'concat']);

  
  /*
  grunt.registerTask('default', 'ntw fixer upper', function() {
    var arr = [];
  	episodes = grunt.file.readJSON('episodes.json');	

    grunt.task
      .then("buildArr", function() {
        var c = 1;
        for (var i = 0; i < episodes['episodes'].length; i++) {
          //var decoded = decodeURIComponent(episodes['episodes'][i].info.url);
          var id = episodes['episodes'][i].title.split(': ');
          var images = episodes['episodes'][i].info['html'];

          grunt.file.copy('nearthewildbuslogo.jpg', 'episodes/'+id[0]+'/nearthewildbuslogo.jpg');
          
          for (var ii = 0; ii < episodes['episodes'][i].info['html'].length; ii++) {
            //grunt.file.mkdir("episodes/"+id[0]);



            console.log(id[0]+": "+ii+" - " +episodes['episodes'][i].info['html'][ii].image);

            grunt.config(['shell', 'dl_episode_images_'+c], {
              command: 'wget -P episodes/'+id[0]+' '+episodes['episodes'][i].info['html'][ii].image+'',
            });
            c++;
          }
          
        }
      })
      .run("shell")

  });
  */

};


