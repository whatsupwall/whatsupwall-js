;
(function($) {

  var INTAGRAM_REGEX = /instagr\.am\/p\/\w+\/?/
  var TWITPIC_REGEX = /twitpic.com\/(\w+)/

  var timers = {};
  var params = {};
  var container;

  function queryTwitter(params) {
    if (!params.match(/^\?/)) {
      params = "?" + params
    }
    $.getJSON("http://search.twitter.com/search.json" + params + "&rpp=35&include_entities=1&result_type=recent&callback=?", handleResponse).error(handleError);
  }

  function handleError(data) {
    console.log("Error")
  }

  function handleResponse(data) {
    if (data.error) {
      console.log("ERREUR")
      return;
    }
    appendTweets(data)
    if (data.refresh_url) {
      clearTimer('autoRefresh')
      startTimer('autoRefresh', params.refreshTime, queryTwitter, data.refresh_url);
    }

    var nbChild = container.children().size();
    var maxItem = 100;
    if (nbChild > maxItem) {
      container.isotope('remove', container.children().slice(maxItem));
    }
  }

  function replaceInText(obj, regex, replacer) {
    obj['text'] = obj['text'].replace(regex, replacer)
  }

  function mineConcat(obj, fields) {
    var res = [];
    for (var i = 0; i < fields.length; i++) {
      var field = fields[i]
      if (obj[field]) {
        res = res.concat(obj[field])
      }
    };
    return res;
  }

  function appendTweets(data) {
    $.map(data['results'], function(obj, index) {
      // add created_from value
      obj['created_from'] = moment(obj['created_at']).fromNow()
      obj['added_at'] = moment().toDate();

      var entities = mineConcat(obj.entities, ["urls", "hashtags", "user_mentions", "media"]).sort(function(a, b) {
        return a.indices[0] - b.indices[0];
      });
      fillEntities(obj, entities);

      $.map(obj.entities.urls, function(url) {
        if (url.expanded_url.match(INTAGRAM_REGEX)) {
          addMedia(obj, url.expanded_url + "media/?size=t")
          return;
        }

        var twitpic = url.expanded_url.match(TWITPIC_REGEX)
        if (twitpic) {
          addMedia(obj, "http://twitpic.com/show/thumb/" + twitpic[1])
          return;
        }
      })
    });

    // Rendering
    var tweets = ich.tweet(data);
    container.prepend(tweets).isotope('reloadItems').isotope({
      sortBy: 'original-order'
    })
  }

  function fillEntities(obj, entities) {
    var start = 0,
      text = "";
    for (var i = 0; i < entities.length; i++) {
      var entity = entities[i];
      text += obj.text.slice(start, entity.indices[0]);

      if (entity.url) {
        text += '<a href="' + entity.url + '" title="' + entity.expanded_url + '">' + entity.display_url + '</a>';
      } else if (entity.name) {
        text += '<a href="https://www.twitter.com/' + entity.screen_name + '">@' + entity.name + '</a>'
      } else if (entity.text) {
        text += '<a href="https://www.twitter.com/' + entity.text + '">#' + entity.text + '</a>'
      }

      if (entity.media_url && entity.type == "photo") {
        addMedia(obj, entity.media_url + ":thumb")
      }

      start = entity.indices[1]
    };
    text += obj.text.slice(start, obj.text.length)

    obj.text = text;
  }

  function startTimer(name, timeout, func, data) {
    timers[name] = setTimeout(function() {
      func(data);
      startTimer(name, timeout, func, data)
    }, timeout)
  }

  function addMedia(obj, url) {
    if (!obj.image_url) {
      obj.image_url = []
    }
    obj.image_url.push(url)
  }

  function clearTimer(name) {
    clearTimeout(timers[name])
  }

  function updateTweets() {
    container.children().each(function() {
      var that = $(this)
      that.find(".create_from").html(moment(that.data('createdAt')).fromNow())

      var diff = moment().diff(moment(that.data('addedAt')), 'seconds')
      var hex = diff.toString(16);
      that.animate({
        color: "red"
      }, 200);
    })
    container.isotope('reloadItems')
  }

  function search(value) {
    startTimer('updateTweets', params.updateTime, updateTweets);

    clearTimer('autoRefresh')
    container.isotope('remove', container.children());
    queryTwitter("q=" + encodeURI(value));
  }

  function defaultToolbarInit(toolbar) {
    //Input field
    var timeout;
    toolbar.find(".searchInput").keypress(function(e) {
      clearTimeout(timeout)
      var that = $(this);
      timeout = setTimeout(function() {
        if (sessionStorage) {
          sessionStorage.searchInput = that.val()
        }
        search(that.val())
      }, 800);
    }).val("initSearch");

    // Hide image
    toolbar.find(".imageDeleteTools").css("opacity", "0.5").hover(function() {
      var that = $(this);
      that.css("opacity", "1");
      that.css("cursor", "pointer");
    }, function() {
      var that = $(this);
      that.css("opacity", "0.5");
      that.css("cursor", "auto");
    }).click(function() {
      toolbar.remove();
    })
  }

  $.fn.twitisowall = function(opts) {
    params = $.extend({
      updateTime: 2000,
      refreshTime: 4000,
      inputValue: "",
      defaultValue: "arnaudke",
      toolbarOpts: {
        template: {},
        init: defaultToolbarInit
      }
    }, opts)

    return this.each(function() {
      var that = $(this)

      container = $("<div class='twitisowall'></div>").appendTo(that)
      // Init container
      container.isotope({
        // options
        itemSelector: '.item',
        layoutMode: 'masonry',
      });

      var initSearch = params.inputValue || params.defaultValue;
      if (!params.inputValue && sessionStorage && sessionStorage.searchInput) {
        console.log("Search: " + sessionStorage.searchInput)
        initSearch = sessionStorage.searchInput
      }
      search(initSearch)

      if (params.inputValue) {
        return;
      }
      //tools div
      var toolbar = $(ich.toolbar(params.toolbarOpts.template));
      params.toolbarOpts.init(toolbar)
      toolbar.prependTo(that)
    })
  }
})(jQuery);


$(function() {
  $("#container").twitisowall()
});
