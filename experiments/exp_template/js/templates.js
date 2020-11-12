var t1, t2;

// progress bar
function progress(){
  // var trial = exp.data_trials.length;
	// var pct = Math.round(100*(trial + exp.slideIndex+1)/(exp.nQs+1));
  var pct = Math.round(100*(exp.phase+1)/(exp.nQs+1));
	$('.progress-bar').css('width', pct+'%').attr('aria-valuenow', pct);
}

function make_slides(f) {
  var slides = {};

// intro slide
slides.i0 = slide({
    name : "i0",
    start: function() {
        exp.startT = Date.now();
    }
});

// instructions slide
slides.instructions = slide({
    name : "instructions",
    button : function() {
        exp.go(); //use exp.go() if and only if there is no "present" data.
    }
});

// random assignment to a between-subject condition
exp.condition = _.sample(["TV show", "book"]);

// ask for an open-ended typed response
slides.single_trial = slide({
    name: "single_trial",

    start: function() {
        $(".err").hide();
        $(".display_condition").html("What's your favorite " + exp.condition + "?");
    },

    button: function() {
        response = $("#text_response").val();
        if (response.length == 0) {
            $(".err").show();
        } else {
            exp.data_trials.push({
                "trial_type": "single_trial",
                "response": response,
                "condition": exp.condition
            });
        exp.go(); //make sure this is at the *end*, after you log your data
        }
    },
});


slides.one_slider = slide({
    name: "one_slider",

    // the variable 'stim' will take on each of these 3 pairs
    // of values in random order
    // for each, present_handle will be run
    present: _.shuffle([
            {
              subject: "dog",
              object: "frisbee"
            },
            {
              subject: "cat",
              object: "windowsill"
            },
            {
              subject: "bird",
              object: "shiny object"
            },
    ]),

    //this gets run only at the beginning of the block
    present_handle: function(stim) {
        progress();
        t1 = new Date();
        $(".err").hide();
        this.stim = stim;
        $(".prompt").html(stim.subject + "s like " + stim.object + "s");
        this.init_sliders();
        exp.sliderPost = null; //erase current slider value
    },

    button: function() {
        if (exp.sliderPost == null) {
            $(".err").show();
        } else {
            this.log_responses();
        /* use _stream.apply(this); if and only if there is
        "present" data. (and only *after* responses are logged) */
            _stream.apply(this);
        }
    },

    init_sliders: function() {
        utils.make_slider("#single_slider", function(event, ui) {
            exp.sliderPost = ui.value;
        });
    },

    log_responses: function() {
        t2 = new Date();
        var rt = ((t2.getTime() - t1.getTime())/100)/10;
        exp.data_trials.push({
            "trial_type": "one_slider",
            "rt":rt,
            "response": exp.sliderPost,
            "subject": this.stim.subject
        });
    }
});


// multiple sliders in a single table
slides.multi_slider = slide({
    name: "multi_slider",

    present: _.shuffle([
              {
                critter:"Wugs",
                property:"fur"
              },
              {
                critter:"Blicks",
                property:"fur"
            }
    ]),

    present_handle: function(stim) {
        progress();
        $(".err").hide();
        this.stim = stim;
        this.sentence_types = _.shuffle(["generic", "negation", "always", "sometimes", "usually"]);

        var sentences = {
            "generic": stim.critter + " have " + stim.property + ".",
            "negation": stim.critter + " do not have " + stim.property + ".",
            "always": stim.critter + " always have " + stim.property + ".",
            "sometimes": stim.critter + " sometimes have " + stim.property + ".",
            "usually": stim.critter + " usually have " + stim.property + "."
        };

        this.n_sliders = this.sentence_types.length;
        $(".slider_row").remove();

        for (var i=0; i<this.n_sliders; i++) {
            var sentence_type = this.sentence_types[i];
            var sentence = sentences[sentence_type];

            $("#multi_slider_table").append('<tr class="slider_row"><td class="slider_target" id="sentence' + i + '">' + "<font size='3'>" + sentence + '</td><td colspan="2"><div id="slider' + i + '" class="slider">-------[ ]--------</div></td></tr>');

            utils.match_row_height("#multi_slider_table", ".slider_target");
        }

        this.init_sliders(this.sentence_types);
        exp.sliderPost = [];
      },

    button: function() {
        if (exp.sliderPost.length < this.n_sliders) {
            $(".err").show();
        } else {
            this.log_responses();
            _stream.apply(this); //use _stream.apply(this); if and only if there is "present" data.
        }
    },

    init_sliders: function(sentence_types) {
        for (var i=0; i<sentence_types.length; i++) {
            var sentence_type = sentence_types[i];
            utils.make_slider("#slider" + i, this.make_slider_callback(i));
        }
    },

    make_slider_callback: function(i) {
        return function(event, ui) {
            exp.sliderPost[i] = ui.value;
        };
    },

    log_responses: function() {
      for (var i=0; i<this.sentence_types.length; i++) {
        var sentence_type = this.sentence_types[i];
        exp.data_trials.push({
          "trial_type": "multi_slider",
          "sentence_type": sentence_type,
          "response": exp.sliderPost[i],
          "critter": this.stim.critter
        });
      }
    },
});

// click on pictures
slides.imagetrial = slide({
    name : "imagetrial",

    present : _.shuffle([
              {
                type: "amb",
                utterance: "Every marble isn't red."
              },
              {
                type: "surface",
                utterance: "None of the marbles are red."
              },
              {
                type: "inverse",
                utterance: "Not all of the marbles are red."
              }
    ]),

    present_handle: function(stim) {
        progress();
        t1 = new Date();
        progress();

        $(".sentence").html("\""+stim.utterance+"\"");

        var shuffleImages = _.shuffle(["surface","inverse"]);

        var leftImage = "<img src=\"expt-files/images/" + stim.type + "every" + shuffleImages[0] + ".png\" class=\"image\"></img>";

        var rightImage = "<img src=\"expt-files/images/" + stim.type + "every" + shuffleImages[1] +".png\" class=\"image\"></img>";

        $("#Image1").html(leftImage);
        $("#Image2").html(rightImage);

        for (var i=0; i<2; i++) {
            var label = 'Image'+(i+1);
          //  var set = stim[label];
        var version = shuffleImages[i]
        $("#"+ label).hover(function(){
            $(this).fadeTo(10,0.5);
        },
        function(){
            $(this).fadeTo(10,1);
        });

        $("#"+ label).click(function(choice) {
            return function() {
                $(".picture").unbind("click");
                $(".picture").empty();
                $(".picture").fadeTo(10,1);
                t2 = new Date();
                var rt = ((t2.getTime() - t1.getTime())/100)/10;
                // var rt = Math.round((t2.getTime() - t1.getTime())/100)/10;
                exp.data_trials.push({
                  "choice": choice,
                  "rt": rt,
                  "side": $(this).attr('id'),
                  "type": stim.type
                });
                setTimeout(function(){
                _stream.apply(_s);
              }, 1000);
              }
            }(version));
          }
        },

        button : function() {
          exp.go();
        }
});


  slides.subj_info =  slide({
    name: "subj_info",
    submit: function(e){
      exp.subj_data = {
        language: $("#language").val(),
        enjoyment: $("#enjoyment").val(),
        asses: $('input[name="assess"]:checked').val(),
        age: $("#age").val(),
        gender: $("#gender").val(),
        education: $("#education").val(),
        comments: $("#comments").val(),
      };
      exp.go(); //use exp.go() if and only if there is no "present" data.
    }
  });

  slides.thanks = slide({
    name : "thanks",
    start : function() {
      exp.data= {
          "trials" : exp.data_trials,
          "catch_trials" : exp.catch_trials,
          "system" : exp.system,
          "condition" : exp.condition,
          "subject_information" : exp.subj_data,
          "time_in_minutes" : (Date.now() - exp.startT)/60000
      };
      setTimeout(function() {turk.submit(exp.data);}, 1000);
    }
  });

  return slides;
}

/// init ///
function init() {
  exp.trials = [];
  exp.catch_trials = [];
  // exp.condition = _.sample(["condition1", "condition2"]); //can randomize between subject conditions here
  exp.system = {
      Browser : BrowserDetect.browser,
      OS : BrowserDetect.OS,
      screenH: screen.height,
      screenUH: exp.height,
      screenW: screen.width,
      screenUW: exp.width
    };
  //blocks of the experiment:
  exp.structure=["i0", "instructions", "single_trial", "one_slider", "multi_slider", "imagetrial", 'subj_info', 'thanks'];
  // exp.structure=["i0", "imagetrial",'subj_info', 'thanks'];

  exp.data_trials = [];
  //make corresponding slides:
  exp.slides = make_slides(exp);

  exp.nQs = utils.get_exp_length(); //this does not work if there are stacks of stims (but does work for an experiment with this structure)
                    //relies on structure and slides being defined

  $('.slide').hide(); //hide everything

  //make sure turkers have accepted HIT (or you're not in mturk)
  $("#start_button").click(function() {
    if (turk.previewMode) {
      $("#mustaccept").show();
    } else {
      $("#start_button").click(function() {$("#mustaccept").show();});
      exp.go();
    }
  });

  exp.go(); //show first slide
}
