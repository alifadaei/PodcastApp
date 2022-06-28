String.prototype.replaceAt = function (index, chars) {
  let a = this.split("");
  a[index] = chars.split("")[0];
  a[index + 1] = chars.split("")[1];
  return a.join("");
};
const titlestring = document.querySelector("#titlestring");
const playlist1 = [
  {
    title: "",
    file: "",
    howl: null,
  },
];
//playlist maker
function playListMaker(year, number, prefix, title, url) {
  let playlist = [];
  for (let i = 1; i <= number; i++) {
    let obj = {};
    obj.title = title;
    if (url) {
      obj.file = url[i - 1];
      obj.is_foreign = true;
    } else obj.file = `${year}-${prefix}-${i}`;
    obj.howl = null;
    obj.year = year;
    playlist.push(obj);
  }
  return playlist;
}

//below for checking if it has continue
if (!localStorage.getItem("id")) {
  document.getElementById("continue-btn").classList.add("hidden");
}

// Cache references to DOM elements.
var elms = [
  "track",
  "timer",
  "duration",
  "playBtn",
  "pauseBtn",
  "prevBtn",
  "nextBtn",
  "playlistBtn",
  "volumeBtn",
  "progress",
  "bar",
  "wave",
  "loading",
  "playlist",
  "list",
  "volume",
  "barEmpty",
  "barFull",
  "sliderBtn",
];
elms.forEach(function (elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function (playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.innerHTML = "جلسه اول";
};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function (index) {
    var self = this;
    var sound;
    index = typeof index === "number" ? index : self.index;
    var data = self.playlist[index];
    setIndexLS(index);
    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: [
          (data.is_foreign ? "" : "https://dl.zadossafar.ir/app_audio/audio/") +
            data.file +
            ".mp3",
        ],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function () {
          setMyInterval();
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = "block";
          bar.style.display = "none";
          pauseBtn.style.display = "block";
        },
        onload: function () {
          // Start the wave animation.
          if (continued) {
            seekToLast();
            continued = false;
          }
          wave.container.style.display = "block";
          bar.style.display = "none";
          loading.style.display = "none";
        },
        onend: function () {
          clearMyInterval();
          // Stop the wave animation.
          wave.container.style.display = "none";
          bar.style.display = "block";
          self.skip("next");
        },
        onpause: function () {
          clearMyInterval();
          // Stop the wave animation.
          wave.container.style.display = "none";
          bar.style.display = "block";
        },
        onstop: function () {
          clearMyInterval();
          // Stop the wave animation.
          wave.container.style.display = "none";
          bar.style.display = "block";
        },
        onseek: function () {
          // Start updating the progress of the track.
          requestAnimationFrame(self.step.bind(self));
        },
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    numlist = [
      "اول",
      "دوم",
      "سوم",
      "چهارم",
      "پنجم",
      "ششم",
      "هفتم",
      "هشتم",
      "نهم",
      "دهم",
      "یازدهم",
      "دوازدهم",
      "سیزدهم",
      "چهاردهم",
      "پانزدهم",
      "شانزدهم",
      "هفدهم",
      "هجدهم",
      "نوزدهم",
      "بیستم",
      "بیست و یکم",
      "بیست و دوم",
    ];
    track.innerHTML =
      index < 21 ? "جلسه " + numlist[index] : `جلسه ${index + 1}`;
    titlestring.textContent = `${this.playlist[0].title} سال ${this.playlist[0].year}`;
    // Show the pause button.
    if (sound.state() === "loaded") {
      playBtn.style.display = "none";
      pauseBtn.style.display = "block";
    } else {
      loading.style.display = "block";
      playBtn.style.display = "none";
      pauseBtn.style.display = "none";
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Puase the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = "block";
    pauseBtn.style.display = "none";
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function (direction) {
    var self = this;
    // Get the next track based on the direction of the track.
    localStorage.setItem("per", 0);
    setIndexLS(self.index);
    var index = 0;
    if (direction === "prev") {
      index = self.index - 1;
      if (index < 0) {
        index = self.playlist.length - 1;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.length) {
        index = 0;
      }
    }

    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function (index) {
    var self = this;
    setIndexLS(self.index);
    // Stop the current track.
    if (self.playlist[self.index].howl) {
      self.playlist[self.index].howl.stop();
    }

    // Reset progress.
    progress.style.width = "0%";

    // Play the new track.
    self.play(index);
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function (val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = barWidth * 100 + "%";
    sliderBtn.style.left =
      window.innerWidth * barWidth + window.innerWidth * 0.05 - 25 + "px";
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function (per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Convert the percent into a seek position.
    if (sound.playing()) {
      sound.seek(sound.duration() * per);
    }
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function () {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist[self.index].howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = ((seek / sound.duration()) * 100 || 0) + "%";

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function () {
    var self = this;
    var display = playlist.style.display === "block" ? "none" : "block";

    setTimeout(
      function () {
        playlist.style.display = display;
      },
      display === "block" ? 0 : 500
    );
    playlist.className = display === "block" ? "fadein" : "fadeout";
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function () {
    var self = this;
    var display = volume.style.display === "block" ? "none" : "block";

    setTimeout(
      function () {
        volume.style.display = display;
      },
      display === "block" ? 0 : 500
    );
    volume.className = display === "block" ? "fadein" : "fadeout";
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function (secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = secs - minutes * 60 || 0;

    return minutes + ":" + (seconds < 10 ? "0" : "") + seconds;
  },
};

// Setup our new audio player class and pass it the playlist.
var player = new Player(playlist1);
// Bind our player controls.
playBtn.addEventListener("click", function () {
  player.play();
});
pauseBtn.addEventListener("click", function () {
  player.pause();
});
prevBtn.addEventListener("click", function () {
  player.skip("prev");
});
nextBtn.addEventListener("click", function () {
  player.skip("next");
});

const d = document.getElementsByClassName("draggable");
for (let i = 0; i < d.length; i++) {
  d[i].style.position = "relative";
}

/**
 * below for touch ad mouse seeking
 */

function filter(e) {
  let target = {};
  target.moving = true;
  //NOTICE THIS 👇 Check if Mouse events exist on users' device
  if (e.clientX) {
    target.tempX = e.clientX; // If they exist then use Mouse input
    player.seek(target.tempX / window.innerWidth);
    return;
  } else {
    target.tempX = e.touches[0].clientX; // Otherwise use touch input
  }
  //NOTICE THIS 👆 Since there can be multiple touches, you need to mention which touch to look for, we are using the first touch only in this case
  // target.oldLeft = window.getComputedStyle(target).getPropertyValue('left').split('px')[0] * 1;
  const sound = player.playlist[player.index].howl;
  target.oldLeft = sound.seek() / sound.duration();
  // target.oldTop = window.getComputedStyle(target).getPropertyValue('top').split('px')[0] * 1;

  //NOTICE THIS 👇
  waveform.ontouchmove = dr;
  //NOTICE THIS 👆

  function dr(event) {
    console.log("moving ");
    event.preventDefault();

    if (!target.moving) {
      return;
    }
    //NOTICE THIS 👇
    if (!event.clientX) {
      target.distX = event.touches[0].clientX - target.tempX;
      player.seek(target.oldLeft + target.distX / window.innerWidth);
    }

    //NOTICE THIS 👆
    // target.style.left = target.oldLeft + target.distX + "px";
    // target.style.top = target.oldTop + target.distY + "px";
  }

  function endDrag() {
    target.moving = false;
  }
  target.onmouseup = endDrag;
  //NOTICE THIS 👇
  target.ontouchend = endDrag;
  //NOTICE THIS 👆
}
waveform.onmousedown = filter;
//NOTICE THIS 👇
waveform.ontouchstart = filter;
//NOTICE THIS 👆

playlistBtn.addEventListener("click", function () {
  player.togglePlaylist();
});
playlist.addEventListener("click", function () {
  player.togglePlaylist();
});
volumeBtn.addEventListener("click", function () {
  player.toggleVolume();
});
volume.addEventListener("click", function () {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener("click", function (event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener("mousedown", function () {
  window.sliderDown = true;
});
sliderBtn.addEventListener("touchstart", function () {
  window.sliderDown = true;
});
volume.addEventListener("mouseup", function () {
  window.sliderDown = false;
});
volume.addEventListener("touchend", function () {
  window.sliderDown = false;
});

document.getElementById("btn-skip-back").addEventListener("click", function () {
  const myhowl = player.playlist[player.index].howl;
  const per = (myhowl.seek() - 10) / myhowl.duration();
  player.seek(per);
});
document
  .getElementById("btn-skip-forward")
  .addEventListener("click", function () {
    const myhowl = player.playlist[player.index].howl;
    const per = (myhowl.seek() + 10) / myhowl.duration();
    player.seek(per);
  });

var move = function (event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(
      1,
      Math.max(0, layerX / parseFloat(barEmpty.scrollWidth))
    );
    player.volume(per);
  }
};

volume.addEventListener("mousemove", move);
volume.addEventListener("touchmove", move);

// Setup the "waveform" animation.
var wave = new SiriWave({
  container: waveform,
  width: window.innerWidth,
  height: window.innerHeight * 0.3,
  cover: true,
  speed: 0.03,
  amplitude: 0.7,
  frequency: 2,
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function () {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + "px auto";

  // Update the position of the slider.
  var sound = player.playlist[player.index].howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = vol * 0.9;
    sliderBtn.style.left =
      window.innerWidth * barWidth + window.innerWidth * 0.05 - 25 + "px";
  }
};
window.addEventListener("resize", resize);
resize();

//below for defining files and playlists and years and ...

function Year(year, subject_list) {
  this.year = year;
  this.subject_list = subject_list;
}

function Subject(name, trackNumber, playList, id) {
  this.name = name;
  this.id = id;
  this.trackNumber = trackNumber;
  this.playList = playList;
}
//genearting subjects and years
const string85_1 = "زاد السفر، نخستین گام عرفان عملی در اسلام";
const string87_1 = "اخلاق اسلامی";
const string87_2 = "دنیا و آخرت";
const string87_3 = "قرآن در زندگی";
const string87_4 = "اصول اصلاح و افساد";
const string87_5 = "رزق";
const string87_6 = "تقوای خردمندانه";

const subject85_1 = new Subject(
  string85_1,
  11,
  playListMaker(85, 11, "zadossafar", string85_1),
  1
);
const subject87_1 = new Subject(
  string87_1,
  8,
  playListMaker(87, 8, "akhlagh", string87_1),
  2
);
const subject87_2 = new Subject(
  string87_2,
  4,
  playListMaker(87, 4, "donyaakherat", string87_2),
  3
);
const subject87_3 = new Subject(
  string87_3,
  2,
  playListMaker(87, 2, "goran-dar-zendegi", string87_3),
  4
);
const subject87_4 = new Subject(
  string87_4,
  7,
  playListMaker(87, 7, "osoole-eslahva-efsad", string87_4),
  5
);
const subject87_5 = new Subject(
  string87_5,
  10,
  playListMaker(87, 10, "rezgh", string87_5),
  6
);
const subject87_6 = new Subject(
  string87_6,
  15,
  playListMaker(87, 15, "taghvakherad", string87_6),
  7
);

const string90_1 = "انسان برتر";
const string90_2 = "خانواده موفق 1";
const string90_3 = "رجعت";
const string91_1 = "آثار گریه بر سید الشهدا";
const string91_2 = "خطاهای کوچک - آثار افک و اثم در زندگی";
const string91_3 = "جامعه شناسی اسلامی";
const string91_4 = "خانواده موفق 2";
const string91_5 = "مدیریت سازه های معنوی";

const subject90_1 = new Subject(
  string90_1,
  11,
  playListMaker(90, 11, "ensane-bartar", string90_1),
  8
);
const subject90_2 = new Subject(
  string90_2,
  9,
  playListMaker(90, 9, "khanevadeh-1", string90_2),
  9
);
const subject90_3 = new Subject(
  string90_3,
  8,
  playListMaker(90, 8, "rejat", string90_3),
  10
);
const subject91_1 = new Subject(
  string91_1,
  9,
  playListMaker(91, 9, "asare-gerye-bar-seyedoshohada", string91_1),
  11
);
const subject91_2 = new Subject(
  string91_2,
  9,
  playListMaker(91, 9, "efk-va-esm", string91_2),
  12
);
const subject91_3 = new Subject(
  string91_3,
  10,
  playListMaker(91, 10, "jamee-shenasi-eslami", string91_3),
  13
);
const subject91_4 = new Subject(
  string91_4,
  8,
  playListMaker(91, 8, "khanevadeh-2", string91_4),
  14
);
const subject91_5 = new Subject(
  string91_5,
  10,
  playListMaker(91, 10, "modiriate-saze-haye-manavi", string91_5),
  15
);

const string92_1 = "عقل در اصول کافی";
const string93_1 = "اربعین";
const string93_2 = "ادامه افک و اثم";
const string93_3 = "علل عدم حضور خواص در کربلا";
const string93_4 = "امام شناسی";
const string93_5 = "خانواده موفق 3";
const string93_6 = "موت و فوت";
const string93_7 = "رجعت 2";
const string93_8 = "صبر بر مصائب";
const string93_9 = "تحلیل کاربردی تاریخ کربلا";
const string93_10 = "شهادت پیامبر";
const string93_11 = "تفسیر سوره حمد";
const string93_12 = "2 تفسیر سوره حمد";

const subject92_1 = new Subject(
  string92_1,
  9,
  playListMaker(92, 9, "aghl-dar-asoule-kafi", string92_1),
  16
);
const subject93_1 = new Subject(
  string93_1,
  2,
  playListMaker(93, 2, "arbaein", string93_1),
  17
);
const subject93_2 = new Subject(
  string93_2,
  10,
  playListMaker(93, 10, "efk-va-esm-edame", string93_2),
  18
);
const subject93_3 = new Subject(
  string93_3,
  10,
  playListMaker(93, 10, "elale-adame-hozure-khavas-karbala", string93_3),
  19
);
const subject93_4 = new Subject(
  string93_4,
  8,
  playListMaker(93, 8, "emam-shenasi", string93_4),
  20
);
const subject93_5 = new Subject(
  string93_5,
  9,
  playListMaker(93, 9, "khanevadeh-movafagh-3", string93_5),
  21
);
const subject93_6 = new Subject(
  string93_6,
  10,
  playListMaker(93, 10, "mot-va-foat", string93_6),
  22
);
const subject93_8 = new Subject(
  string93_8,
  10,
  playListMaker(93, 10, "sabre-bar-masaeb", string93_8),
  24
);
const subject93_9 = new Subject(
  string93_9,
  10,
  playListMaker(93, 10, "seyyedoshohada-history-karbordi-analyze", string93_9),
  25
);
const subject93_10 = new Subject(
  string93_10,
  3,
  playListMaker(93, 3, "shahadate-payambar", string93_10),
  26
);
const subject93_11 = new Subject(
  string93_11,
  20,
  playListMaker(93, 20, "tafsiresoorehamd", string93_11),
  27
);
const subject93_12 = new Subject(
  string93_12,
  9,
  playListMaker(93, 9, "tafsire-sure-hamd", string93_12),
  28
);

const string94_1 = "درجات قلب";
const string94_2 = "شرح دعای ابو حمزه ثمالی";
const string94_3 = "استحواذالشیطان";
const string94_4 = "حزب الله و حزب الشیطان";
const string94_5 = "معراج";
const string94_6 = "نظم در شریعت";
const string94_7 = "شب قدر";
const string94_8 = "شهادت پیامبر";
const string94_9 = "شرح اصول کافی 2";
const string94_10 = "تفسیر حمد 3";
const string94_11 = "تفسیر مکارم اخلاق";
const string95_1 = "نتایج، علامات، معدات و موانع حسن خلق";
const string95_2 = "لسان الشیعه";
const string95_3 = "سلامت زندگی";
const string95_4 = "شب قدر";
const string95_5 = "شرح اصول کافی 2";
const string95_6 = "اوصاف حضرت صدیقه طاهره(س) 1";

const subject94_1 = new Subject(
  string94_1,
  9,
  playListMaker(94, 9, "darajate-ghalb", string94_1),
  29
);
const subject94_2 = new Subject(
  string94_2,
  8,
  playListMaker(94, 8, "doa-aboohamze-sharh", string94_2),
  30
);
const subject94_3 = new Subject(
  string94_3,
  10,
  playListMaker(94, 10, "esteaze", string94_3),
  31
);
const subject94_4 = new Subject(
  string94_4,
  9,
  playListMaker(94, 9, "hezbollah-hezbosheytan", string94_4),
  32
);
const subject94_5 = new Subject(
  string94_5,
  5,
  playListMaker(94, 5, "meraj", string94_5),
  33
);
const subject94_6 = new Subject(
  string94_6,
  8,
  playListMaker(94, 8, "nazm-dar-shariat", string94_6),
  34
);
const subject94_7 = new Subject(
  string94_7,
  6,
  playListMaker(94, 6, "shabe-ghadr", string94_7),
  35
);
const subject94_8 = new Subject(
  string94_8,
  3,
  playListMaker(94, 3, "shahadate-payambar", string94_8),
  36
);
const subject94_9 = new Subject(
  string94_9,
  6,
  playListMaker(94, 6, "sharhe-osoole-kafi-2", string94_9),
  37
);
const subject94_10 = new Subject(
  string94_10,
  7,
  playListMaker(94, 7, "tafsire-hamd-2", string94_10),
  38
);
const subject94_11 = new Subject(
  string94_11,
  1,
  playListMaker(94, 1, "tafsire-makareme-akhlagh", string94_11),
  39
);
const subject95_1 = new Subject(
  string95_1,
  9,
  playListMaker(95, 9, "khosh-kholghi", string95_1),
  40
);
const subject95_2 = new Subject(
  string95_2,
  7,
  playListMaker(95, 7, "lesanoshie", string95_2),
  41
);
const subject95_3 = new Subject(
  string95_3,
  5,
  playListMaker(95, 5, "salamate-zendegi", string95_3),
  42
);
const subject95_4 = new Subject(
  string95_4,
  1,
  playListMaker(95, 1, "shabe-ghadr", string95_4),
  43
);
const subject95_5 = new Subject(
  string95_5,
  1,
  playListMaker(95, 1, "sharhe-ossole-kafi-2", string95_5),
  44
);
const subject95_6 = new Subject(
  string95_6,
  10,
  playListMaker(95, 10, null, string95_6),
  45
);

const string97_1 = "تاثیر ذکر در اقتصاد اسلامی";
const link97_1 = [
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/01-13970227",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/02-13970229",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/03-13970230",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/04-13970231",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/05-13970301",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/06-13970302",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/07-13970303",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/08-13970304",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/01-tasire_zekr/09-13970305",
];
const subject97_1 = new Subject(
  string97_1,
  9,
  playListMaker(97, 9, null, string97_1, link97_1),
  46
);

const string97_2 = "متغیرهای تأثیرگذار در حلیت و طیب بودن رزق";
const link97_2 = [
  "https://dl.zadossafar.ir/speech/01_islamic_economics/02-rezqe_halal_va_tayeb/01-970703",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/02-rezqe_halal_va_tayeb/02-970704",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/02-rezqe_halal_va_tayeb/03-970705",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/02-rezqe_halal_va_tayeb/04-970706",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/02-rezqe_halal_va_tayeb/05-970707",
];
const subject97_2 = new Subject(
  string97_2,
  5,
  playListMaker(97, 5, null, string97_2, link97_2),
  47
);

const string98_1 = "تأثیر عمل اخلاقی در متغیرهای نامتعارف اقتصاد اسلامی";
const link98_1 = [
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/01-980217",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/02-980218",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/03-980219",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/04-980221",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/05-980222",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/06-980223",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/07-980224",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/08-980225",
  "https://dl.zadossafar.ir/speech/01_islamic_economics/03-tasire_amale_akhlaghi/09-980226",
];
const subject98_1 = new Subject(
  string98_1,
  9,
  playListMaker(98, 9, null, string98_1, link98_1),
  48
);

const string94_12 = "شرایط آمر، مامور و اصل امر و نهی";
const link94_12 = [
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/01-13940812",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/02-13940813",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/03-13940814",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/04-13940815",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/05-13940816",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/06-13940817",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/07-13940818",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/08-13940819",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/09-13940820",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/01-sharayete_amronahi/10-13940821",
];
const subject94_12 = new Subject(
  string94_12,
  10,
  playListMaker(94, 10, null, string94_12, link94_12),
  49
);

const string94_13 = "فضایل، مراحل، غایات و شرایط";
const link94_13 = [
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/01-13950711",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/02-13950712",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/03-13950713",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/04-13950714",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/05-13950715",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/06-13950716",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/07-13950717",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/08-13950718",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/09-13950719",
  "https://dl.zadossafar.ir/speech/02-amre_be_maroof/02-fazael_marahel_qayat/10-13950720",
];
const subject94_13 = new Subject(
  string94_13,
  10,
  playListMaker(94, 10, null, string94_13, link94_13),
  50
);

const string95_7 = "شوخی در خوش رفتاری";
const link95_7 = [
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/01-13950722",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/02-13950723",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/03-13950724",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/04-13950725",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/05-13950726",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/06-13950727",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/07-13950728",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/08-13950729",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/02-shookhi_dar_khoshraftari/09-13950730",
];
const subject95_7 = new Subject(
  string95_7,
  9,
  playListMaker(95, 9, null, string95_7, link95_7),
  51
);

const string96_1 = "تشخیص تکلیف";
const link96_1 = [
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/03-tashkhise_taklif/01-13960320",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/03-tashkhise_taklif/02-13960321",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/03-tashkhise_taklif/03-13960322",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/03-tashkhise_taklif/04-13960323",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/03-tashkhise_taklif/05-13960324",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/03-tashkhise_taklif/06-13960325",
];
const subject96_1 = new Subject(
  string96_1,
  6,
  playListMaker(96, 6, null, string96_1, link96_1),
  52
);

const string96_2 = "صبر و رضا- دنیا، مرگ، بهشت و جهنم";
const link96_2 = [
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/01-13960709",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/02-13960710",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/03-13960711",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/04-13960712",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/05-13960713",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/06-13960714",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/07-13960715",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/08-13960716",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/09-13960717",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/04-sabr_va_reza/10-13960718",
];
const subject96_2 = new Subject(
  string96_2,
  10,
  playListMaker(96, 10, null, string96_2, link96_2),
  53
);

const string97_3 = "مناسبات انسانی در اسلام";
const link97_3 = [
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/01-13970306",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/02-13970307",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/03-13970308",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/04-13970309",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/05-13970310",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/06-13970312",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/07-13970313",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/08-13970314",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/05-monasebate_ensani/09-13970315",
];
const subject97_3 = new Subject(
  string97_3,
  10,
  playListMaker(97, 10, null, string97_3, link97_3),
  54
);

const string97_4 = "عفو";
const link97_4 = [
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/01-970629",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/02-970630",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/03-970631",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/04-970701",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/05-970702",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/07-970704",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/08-970705",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/09-970706",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/06-afv/10-970707",
];
const subject97_4 = new Subject(
  string97_4,
  10,
  playListMaker(97, 10, null, string97_4, link97_4),
  55
);

const string98_2 = "تحابب";
const link98_2 = [
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/01-13980228",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/02-13980229",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/03-13980230",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/04-13980231",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/05-13980301",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/06-13980302",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/07-13980304",
  "https://dl.zadossafar.ir/speech/03-hosne_kholq/07-tahabob/08-13980305",
];
const subject98_2 = new Subject(
  string98_2,
  8,
  playListMaker(98, 8, null, string98_2, link98_2),
  56
);

const string95_8 = "استعاذه و استحواذ";
const link95_8 = [
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/01-13950820",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/02-13950821",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/03-13950822",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/04-13950823",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/05-13950824",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/06-13950825",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/07-13950826",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/08-13950827",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/09-13950828",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/02-esteaze_va_estehvaz/10-13950829",
];
const subject95_8 = new Subject(
  string95_8,
  10,
  playListMaker(95, 10, null, string95_8, link95_8),
  57
);

const string90_4 = "مهندسی ارتباطات و معماری روابط انسان مسلم سالم";
const link90_4 = [
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/01",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/02",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/03",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/04",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/06",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/07",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/08",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/09",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/03-mohandesie_ertebatat/10",
];
const subject90_4 = new Subject(
  string90_4,
  9,
  playListMaker(90, 9, null, string90_4, link90_4),
  58
);

const string96_3 = "مدل اسلامی ازدواج";
const link96_3 = [
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/01-13960808",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/02-13960809",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/03-13960810",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/04-13960811",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/05-13960812",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/06-13960813",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/07-13960814",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/08-13960815",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/06-modele_eslamie_ezdevaj/10-13960817",
];
const subject96_3 = new Subject(
  string96_3,
  10,
  playListMaker(96, 10, null, string96_3, link96_3),
  59
);

const string94_14 = "متغیرهای موثر بر شاکله موثر بر عمل";
const link94_14 = [
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/01",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/02",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/03",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/04",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/05",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/06",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/07",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/08",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/09",
];
const subject94_14 = new Subject(
  string94_14,
  9,
  playListMaker(94, 9, null, string94_14, link94_14),
  60
);

const string97_5 = "متغیرهای نامتعارف در مدیریت خانه و خانواده";
const link97_5 = [
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/08-motaqayerhaye_moaser_ar_shakele/09",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/09-motaqayerhaye_namotaaref/02-13970630",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/09-motaqayerhaye_namotaaref/03-13970631",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/09-motaqayerhaye_namotaaref/04-13970701",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/09-motaqayerhaye_namotaaref/05-13970702",
];
const subject97_5 = new Subject(
  string97_5,
  5,
  playListMaker(97, 5, null, string97_5, link97_5),
  61
);

const string97_6 = "حضور حضرت امیرالمومنین علیه السلام در پیوند خانه و خانواده";
const link97_6 = [
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/10-hozoure_hazrate_AMIR_pbuh_dar_peyvande_khanevade/01-13970629",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/10-hozoure_hazrate_AMIR_pbuh_dar_peyvande_khanevade/02-13970630",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/10-hozoure_hazrate_AMIR_pbuh_dar_peyvande_khanevade/03-13970631",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/10-hozoure_hazrate_AMIR_pbuh_dar_peyvande_khanevade/04-13970701",
  "https://dl.zadossafar.ir/speech/06-khanevade_movafaq/10-hozoure_hazrate_AMIR_pbuh_dar_peyvande_khanevade/05-13970702",
];
const subject97_6 = new Subject(
  string97_6,
  5,
  playListMaker(97, 5, null, string97_6, link97_6),
  62
);

const stringglobal_1 = "بررسی احوالات بازماندگان از واقعه کربلا";
const linkglobal_1 = [
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/01-13920817",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/02-13920824",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/03-13920901",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/04-13920908",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/05-13920915",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/06-13920929",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/1-1392/07-13921006",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/2-1393/03-13930823",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/2-1393/04-13930830",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/2-1393/05-13930921",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/2-1393/06-13930928",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/2-1393/01-13930809",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/2-1393/02-13930816",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/01-13940724",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/02-13940801",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/03-13940808",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/04-13940815",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/05-13940822",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/06-13940829",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/07-13940906",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/3-1394/08-13940913",
];
const subjectglobal_1 = new Subject(
  stringglobal_1,
  21,
  playListMaker(1400, 21, null, stringglobal_1, linkglobal_1),
  63
);

const string95_9 = "بررسی احوالات چهره های منفی واقعه کربلا";
const link95_9 = [
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/01-13950716",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/02-13950723",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/03-13950730",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/04-13950807",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/05-13950814",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/06-13950821",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/07-13950828",
  "https://dl.zadossafar.ir/speech/04-hazrate_sayedoshohada_pbuh/01-ebrathaye_ashoura/4-1395/08-13950905",
];
const subject95_9 = new Subject(
  string95_9,
  8,
  playListMaker(95, 8, null, string95_9, link95_9),
  64
);

const stringglobal_2 = "تفسیر سوره مبارکه فاتحة الکتاب";
const linkglobal_2 = [
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/01",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/02",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/03",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/04",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/05",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/06",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/07",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/08",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/09",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/10",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/11",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/12",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/13",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/14",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/15",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/16",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/17",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/18",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/19",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/20",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/21",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/22",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/23",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/24",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/25",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/26",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/28",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/29",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1393/30",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/01-13940328",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/02-13940329",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/03-13940330",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/04-13940331",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/05-13940401",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/06-13940402",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/07-13940403",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/08-13940404",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/09-13940405",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/10-13940406",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/11-13940407",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/12-13940408",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/13-13940409",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/14-13940410",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/15-13940411",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/16-13940412",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/17-13940413",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/18-13940414",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/19-13940415",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/20-13940416",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/21-13940417",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/22-13940418",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/23-13940419",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/24-13940420",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/25-13940421",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/26-13940422",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/27-13940423",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/28-13940424",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/29-13940425",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1394/30-13940426",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/01-13950318",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/02-13950319",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/03-13950320",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/04-13950321",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/05-13950322",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/06-13950323",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/07-13950324",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/08-13950325",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/09-13950326",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/10-13950327",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/11-13950328",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/12-13950329",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/13-13950330",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/14-13950331",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/15-13950401",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/16-13950402",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/17-13950403",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/18-13950404",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/19-13950405",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/20-13950406",
];
const subjectglobal_2 = new Subject(
  stringglobal_2,
  79,
  playListMaker(1400, 79, null, stringglobal_2, linkglobal_2),
  65
);

const stringglobal_3 = "تفسیر سوره مبارکه بقره";
const linkglobal_3 = [
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/21-13950407",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/22-13950408",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/23-13950409",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/24-13950410",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/25-13950411",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/26-13950412",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/27-13950413",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/28-13950414",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1395/29-13950415",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/01-13960306",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/02-13960307",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/03-13960308",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/04-13960309",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/05-13960310",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/06-13960311",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/07-13960312",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/08-13960313",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/09-13960314",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/10-13960315",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/11-13960316",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/12-13960317",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/13-13960318",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/14-13960319",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/15-13960320",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/16-13960321",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/17-13960322",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/18-13960323",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/19-13960324",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/20-13960325",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/21-13960326",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/22-13960327",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/23-13960328",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/24-13960329",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/25-13960330",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/26-13960331",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/27-13960401",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/28-13960402",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/29-13960403",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1396/30-13960404",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/01-13970227",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/02-13970228",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/03-13970229",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/04-13970230",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/05-13970231",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/06-13970301",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/07-13970302",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/08-13970303",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/09-13970304",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/10-13970305",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/11-13970306",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/12-13970307",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/13-13970308",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/14-13970309",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/15-13970310",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/16-13970311",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/17-13970312",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/18-13970313",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/19-13970314",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/20-13970315",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/21-13970316",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/22-13970317",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/23-13970319",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/24-13970320",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/25-13970321",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/26-13970322",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/27-13970323",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1397/28-13970324",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/01-13980217",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/02-13980218",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/03-13980219",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/04-13980220",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/05-13980221",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/06-13980222",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/07-13980223",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/08-13980224",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/09-13980225",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/10-13980226",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/11-13980227",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/12-13980228",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/13-13980229",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/14-13980230",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/15-13980231",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/16-13980301",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/17-13980302",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/18-13980303",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/19-13980304",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/20-13980305",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/21-13980306",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/22-13980307",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/23-13980308",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/24-13980309",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/25-13980310",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/26-13980311",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/27-13980312",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/28-13980313",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1398/29-13980314",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/01",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/02",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/03",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/04",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/05",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/06",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/07",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/08",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/09",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/10",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/11",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/12",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/13",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/14",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/15",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/16",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/17",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/18",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/19",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/20",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/21",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/22",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/23",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/24",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/25",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/26",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/27",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/28",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1399/29",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/01",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/02",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/03",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/04",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/05",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/06",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/07",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/08",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/09",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/10",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/11",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/12",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/13",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/14",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/15",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/16",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/17",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/18",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/19",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/20",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/21",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/22",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/23",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/24",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/25",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/26",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/27",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/28",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/29",
  "https://dl.zadossafar.ir/speech/07-tafsire_Quran/1400/30",
];
const subjectglobal_3 = new Subject(
  stringglobal_3,
  155,
  playListMaker(1400, 155, null, stringglobal_3, linkglobal_3),
  66
);

const stringglobal_4 = "كِتَابُ الْعَقْلِ وَالْجَهْلِ شرح حدیث اول تا نهم";
const linkglobal_4 = [
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/01-13920428",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/02-13920429",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/03-13920430",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/04-13920431",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/05-13920501",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/06-13920502",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/07-13920503",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/01-1392/08-13920504",
];
const subjectglobal_4 = new Subject(
  stringglobal_4,
  8,
  playListMaker(1400, 8, null, stringglobal_4, linkglobal_4),
  67
);

const stringglobal_5 = "كِتَابُ الْعَقْلِ وَالْجَهْلِ شرح حدیث چهاردهم ";
const linkglobal_5 = [
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/01-13950318",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/02-13950322",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/03-13950325",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/04-13950329",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/05-13950401",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/06-13950405",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/07-13950408",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/08-13950408",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/09-13950415",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/10-13950724",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/11-13950727",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/12-13950801",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/13-13950804",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/14-13950808",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/15-13950811",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/16-13950815",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/17-13950818",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/18-13950822",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/19-13950825",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/20-13950829",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/21-13950902",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/22-13950906",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/02-1395/23-13950909",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/01-13960306",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/02-13960309",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/03-13960313",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/04-13960316",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/05-13960320",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/06-13960323",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/07-13960327",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/08-13960330",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/03-1396/09-13960403",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/04-1396/01-13960711",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/04-1396/02-13960716",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/04-1396/03-13960718",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/04-1396/04-13960722",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/04-1396/05-13960725",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/01-13970226",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/02-13970227",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/03-13970228",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/04-13970229",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/05-13970230",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/06-13970231",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/07-13970301",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/08-13970302",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/09-13970303",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/10-13970304",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/11-13970305",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/12-13970306",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/13-13970307",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/14-13970308",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/16-13970310",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/17-13970311",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/18-13970312",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/19-13970313",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/20-13970314",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/21-13970315",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/05-1397/22-13970316",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/01-13970810",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/02-13970811",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/03-13970813",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/04-13970814",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/05-13970815",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/06-13970816",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/06-1397/07-13970817",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/01-13971110",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/02-13971111",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/03-13971112",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/04-13971113",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/05-13971114",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/06-13971121",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/07-13971122",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/08-13971123",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/09-13971124",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/10-13971125",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/07-1397/11-13971126",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/01.17.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/02.18.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/03.19.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/04.20.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/05.21.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/06.22.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/07.23.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/08.24.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/09.25.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/10.26.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/11.27.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/12.28.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/13.29.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/14.30.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/15.31.02.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/16.01.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/17.02.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/18.03.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/19.04.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/20.05.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/21.06.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/22.07.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/23.08.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/24.09.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/25.10.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/26.11.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/27.12.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/28.13.03.1398",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/08-1398/29.14.03.1398",
];
const subjectglobal_5 = new Subject(
  stringglobal_5,
  105,
  playListMaker(1400, 105, null, stringglobal_5, linkglobal_5),
  68
);

const stringglobal_6 =
  " كِتَابُ الْعَقْلِ وَالْجَهْلِ شرح حدیث پانزدهم تا سی و ششم";
const linkglobal_6 = [
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/01-13980629",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/02-13980630",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/03-13980631",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/04-13980701",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/05-13980702",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/06-13980703",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/07-13980704",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/08-13980705",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/09-13980706",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/09-1398/10-13980707",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/01",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/02",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/03",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/04",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/05",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/06",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/07",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/08",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/09",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/10",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/11",
];
const subjectglobal_6 = new Subject(
  stringglobal_6,
  21,
  playListMaker(1400, 21, null, stringglobal_6, linkglobal_6),
  69
);

const stringglobal_7 = "کِتَابُ فَضْلِ الْعِلْمِ";
const linkglobal_7 = [
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/11",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/12",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/13",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/14",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/15",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/16",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/17",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/18",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/19",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/20",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/21",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/22",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/23",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/24",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/25",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/26",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/27",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/28",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/10-1399/29",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/01",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/02",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/03",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/04",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/05",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/06",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/07",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/08",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/09",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/10",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/11",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/12",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/13",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/14",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/15",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/16",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/17",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/18",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/19",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/20",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/21",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/22",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/23",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/24",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/25",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/26",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/27",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/28",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/29",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/11-1399/30",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/01",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/02",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/03",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/04",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/05",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/06",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/07",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/08",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/09",
  "https://dl.zadossafar.ir//speech/05-sharhe_osoule_kaafi/12-1399/10",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/01",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/02",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/03",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/04",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/05",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/06",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/07",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/08",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/09",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/10",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/11",
];
const subjectglobal_7 = new Subject(
  stringglobal_7,
  70,
  playListMaker(1400, 70, null, stringglobal_7, linkglobal_7),
  70
);

const stringglobal_8 = "کِتَابُ توحید";
const linkglobal_8 = [
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/12",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/13",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/14",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/15",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/16",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/17",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/18",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/19",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/20",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/21",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/22",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/23",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/24",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/25",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/26",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/27",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/28",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/29",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/13-1400/30",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/01",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/02",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/03",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/04",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/05",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/06",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/07",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/08",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/09",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/10",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/11",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/12",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/13",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/14",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/15",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/16",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/17",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/18",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/19",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/20",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/21",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/22",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/23",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/24",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/25",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/26",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/27",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/28",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/29",
  "https://dl.zadossafar.ir/speech/05-sharhe_osoule_kaafi/14-1400/30",
];
const subjectglobal_8 = new Subject(
  stringglobal_8,
  49,
  playListMaker(1400, 49, null, stringglobal_8, linkglobal_8),
  71
);

const stringglobal_9 = "تقوا (زادالسفر) منازل، مقامات و حالات";
const linkglobal_9 = [
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/01",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/02",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/03",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/04",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/05",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/06",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/07",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/08",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/09",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/10",
  "https://dl.zadossafar.ir/speech/08-taqva/01-manazel_maqamat_halaat/11",
];
const subjectglobal_9 = new Subject(
  stringglobal_9,
  11,
  playListMaker(1400, 11, null, stringglobal_9, linkglobal_9),
  72
);

const stringglobal_10 = "خلاصه ای در تشریح بازوهای رشد";
const linkglobal_10 = ["https://dl.zadossafar.ir/speech/08-taqva/01"];
const subjectglobal_10 = new Subject(
  stringglobal_10,
  1,
  playListMaker(1400, 1, null, stringglobal_10, linkglobal_10),
  73
);

const stringglobal_11 = "مقایسه مکاتب اخلاقی عراق، نراق و خمین";
const linkglobal_11 = [
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/01-13950820",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/02-13950821",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/03-13950822",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/04-13950823",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/05-13950824",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/06-13950825",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/07-13950826",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/08-13950827",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/09-13950828",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/01-1395/10-13950829",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/01-13960630",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/02-13960631",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/03-13960701",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/04-13960702",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/05-13960703",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/06-13960704",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/07-13960705",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/08-13960706",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/09-13960707",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/02-1396/10-13960708",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/01-13970708",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/02-13970709",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/03-13970710",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/04-13970711",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/05-13970712",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/06-13970713",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/07-13970714",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/08-13970715",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/09-13970716",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/03-1397/10-13970717",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/01-13980609",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/02-13980610",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/03-13980611",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/04-13980612",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/05-13980613",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/06-13980614",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/07-13980615",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/08-13980616",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/10-13980618",
  "https://dl.zadossafar.ir/speech/09-nezame_akhlaqi/04-1398/09-13980617",
];
const subjectglobal_11 = new Subject(
  stringglobal_11,
  40,
  playListMaker(1400, 40, null, stringglobal_11, linkglobal_11),
  74
);

year85 = new Year(85, [subject85_1]);
year87 = new Year(87, [
  subject87_1,
  subject87_2,
  subject87_3,
  subject87_4,
  subject87_5,
  subject87_6,
]);
year90 = new Year(90, [subject90_1, subject90_2, subject90_3, subject90_4]);
year91 = new Year(91, [
  subject91_1,
  subject91_2,
  subject91_3,
  subject91_4,
  subject91_5,
]);
year92 = new Year(92, [subject92_1]);
year93 = new Year(93, [
  subject93_1,
  subject93_2,
  subject93_3,
  subject93_4,
  subject93_5,
  subject93_6,
  subject93_8,
  subject93_9,
  subject93_10,
  subject93_11,
  subject93_12,
]);
year94 = new Year(94, [
  subject94_1,
  subject94_2,
  subject94_3,
  subject94_4,
  subject94_5,
  subject94_6,
  subject94_7,
  subject94_8,
  subject94_9,
  subject94_10,
  subject94_11,
  subject94_12,
  subject94_13,
  subject94_14,
]);
year95 = new Year(95, [
  subject95_1,
  subject95_2,
  subject95_3,
  subject95_4,
  subject95_5,
  subject95_6,
  subject95_7,
]);
year96 = new Year(96, [subject96_1, subject96_2, subject96_3]);
year97 = new Year(97, [
  subject97_1,
  subject97_2,
  subject97_3,
  subject97_4,
  subject97_5,
  subject97_6,
]);
year98 = new Year(98, [subject98_1, subject98_2]);
yearGlobal = new Year(1400, [
  subjectglobal_1,
  subjectglobal_2,
  subjectglobal_3,
  subjectglobal_4,
  subjectglobal_5,
  subjectglobal_6,
  subjectglobal_7,
  subjectglobal_8,
  subjectglobal_9,
  subjectglobal_10,
  subjectglobal_11,
]);

years = [
  year85,
  year87,
  year90,
  year91,
  year92,
  year93,
  year94,
  year95,
  year97,
  year98,
];

//below for generating HTML of nodes
//generate years:

//for global year
{
  const year_node = document.createElement("div");
  year_node.setAttribute("class", "col col-12 col-sm-6 col-md-4 py-3 py-md-5");
  const paragraphElem = document.createElement("p");
  const yearNum = yearGlobal["year"];
  console.log("yearNum:", yearNum);
  paragraphElem.setAttribute("datayear", yearNum.toString());
  paragraphElem.style.backgroundImage = `url(./img/tile${yearNum.toString()}.jpg)`;
  paragraphElem.setAttribute("class", "square");
  paragraphElem.textContent = "موضوعی";
  year_node.appendChild(paragraphElem);
  document.querySelector("#home.container .row").appendChild(year_node);
}

years.forEach(function (year) {
  let year_node = document.createElement("div");
  year_node.setAttribute("class", "col col-12 col-sm-6 col-md-4 py-3 py-md-5");
  const paragraphElem = document.createElement("p");
  const yearNum = year["year"];
  paragraphElem.setAttribute("datayear", yearNum.toString());
  paragraphElem.style.backgroundImage = `url(./img/tile${yearNum.toString()}.jpg)`;
  paragraphElem.setAttribute("class", "square");
  paragraphElem.textContent = "سال " + year["year"];
  year_node.appendChild(paragraphElem);
  document.querySelector("#home.container .row").appendChild(year_node);
});

//below for controling year
let selectedYear;
const homeElement = document.getElementById("home");
const subjectElement = document.getElementById("subject");
document
  .querySelectorAll("#home div.row div.col p.square")
  .forEach(function (elem) {
    elem.addEventListener("click", selectYear);
  });

function selectYear(e) {
  //attach listener to back button
  document
    .querySelector("#subject .btn-back.btn-back--subject")
    .addEventListener("click", function () {
      homeElement.classList.remove("hidden");
      subjectElement.innerHTML = `<div>  <img class="btn-back btn-back--subject" src="img/back.png" alt="back" /></div><img id="besmellah-2" src="./img/besmellah.jpg" alt="بسم الله" /><h1 class="center">لطفا موضوع سال <span></span>را انتخاب کنید</h1>`;
      subjectElement.classList.add("hidden");
    });
  window.scrollTo(0, 0);
  let yearNumber = e.target.attributes["datayear"].value;
  document.querySelector("#subject .center span").textContent =
    yearNumber + " ";
  // console.log(year);
  homeElement.classList.add("hidden");
  if (yearNumber != 1400)
    selectedYear = years.find((year) => year.year === Number(yearNumber));
  else selectedYear = yearGlobal;
  let subjectsList = selectedYear["subject_list"];
  subjectsList.forEach(function (subject) {
    const subjectTextNode = document.createTextNode(subject.name);
    const subjectNode = document.createElement("div");
    subjectNode.setAttribute("class", "py-4 border-bottom");
    subjectNode.setAttribute("id", subject.id);
    subjectNode.appendChild(subjectTextNode);
    subjectNode.addEventListener("click", selectSubject);
    subjectElement.appendChild(subjectNode);
  });
  subjectElement.classList.remove("hidden");
}

// select subject
let myInterval;

function setIndexLS(index) {
  window.localStorage.setItem("index", index);
}

function setIDLS(id) {
  window.localStorage.setItem("id", id);
}

function setMyInterval() {
  myInterval = setInterval(printPer, 10000);
}

function clearMyInterval() {
  clearInterval(myInterval);
}
let idNumber;
const playerElem = document.querySelector("#player");

function selectSubject(e) {
  const elem = e.target;
  idNumber = elem.attributes["id"].value;
  setIDLS(idNumber);
  // console.log(idNumber);
  showPlayer();
}

function showPlayer() {
  //attach event listener to back of player
  document
    .querySelector("#player .btn-back.btn-back--player")
    .addEventListener("click", function () {
      subjectElement.classList.remove("hidden");
      playerElem.classList.add("hidden");
      document.body.style.background = "";
      document.body.classList.remove("player-body");
      player.pause();
    });

  subjectElement.classList.add("hidden");
  playerElem.classList.remove("hidden");
  const is_desktop = window.innerWidth > 768;
  let url;
  if (!is_desktop) {
    url = `./img/back${Number(idNumber)}.jpg`;
  } else {
    url = `./img/backx${Number(idNumber)}.jpg`;
  }
  console.log(url);
  document.body.style.background = `url(${url})`;
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundSize = "cover";
  document.body.classList.add("player-body");
  const subject = selectedYear["subject_list"].find(
    (item) => item.id == idNumber
  );
  // console.log(subject.playList);
  player.playlist = subject.playList;
  player.index = 0;

  player.play();
  track.innerHTML = "جلسه اول";
  // Setup the playlist display.
  player.playlist.forEach(function (song) {
    var div = document.createElement("div");
    div.className = "list-song";
    div.innerHTML = song.title;
    div.onclick = function () {
      player.skipTo(player.playlist.indexOf(song));
    };
    list.appendChild(div);
  });
}
//below for intro
introElem = document.getElementById("intro");
document.querySelector("#intro .button").addEventListener("click", function () {
  document.querySelector("footer").classList.add("hidden");
  introElem.classList.add("hidden");
  homeElement.classList.remove("hidden");
});

function printPer() {
  const myhowl = player.playlist[player.index].howl;
  const per = myhowl.seek() / myhowl.duration();
  // console.log(per);
  window.localStorage.setItem("per", per);
}
let continued = false;
let per;
document.getElementById("continue-btn").addEventListener("click", function () {
  document.querySelector("footer").classList.add("hidden");
  introElem.classList.add("hidden");
  idNumber = Number(localStorage.getItem("id"));
  selectedYear = years.find((year) =>
    year["subject_list"].find((subject) => subject.id === idNumber)
  );

  if (!selectedYear) {
    // console.log('yes')
    selectedYear = yearGlobal;
  }
  player = new Player(playlist1);
  let index = Number(localStorage.getItem("index"));
  showPlayer();
  per = Number(localStorage.getItem("per"));
  continued = true;
  // player.play(index);
  // player.skipTo(index)

  //generating the subjects list HTML and also add back btn listener
  document.querySelector("#subject .center span").textContent =
    selectedYear.year + " ";
  let subjectsList = selectedYear["subject_list"];
  subjectsList.forEach(function (subject) {
    const subjectTextNode = document.createTextNode(subject.name);
    const subjectNode = document.createElement("div");
    subjectNode.setAttribute("class", "py-4 border-bottom");
    subjectNode.setAttribute("id", subject.id);
    subjectNode.appendChild(subjectTextNode);
    subjectNode.addEventListener("click", selectSubject);
    subjectElement.appendChild(subjectNode);
  });
  document
    .querySelector("#subject .btn-back.btn-back--subject")
    .addEventListener("click", function () {
      homeElement.classList.remove("hidden");
      subjectElement.innerHTML = `<div>  <img class="btn-back btn-back--subject" src="img/back.png" alt="back" /></div><img id="besmellah-2" src="./img/besmellah.jpg" alt="بسم الله" /><h1 class="center">لطفا موضوع سال <span></span>را انتخاب کنید</h1>`;
      subjectElement.classList.add("hidden");
    });
});
function seekToLast() {
  player.seek(per);
}
