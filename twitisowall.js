;
var timers = {};

$(function() {
  container = $("#container");

  // Init container
  container.isotope({
    // options
    itemSelector: '.item',
    layoutMode: 'masonry',
  });

  //Input field
  var timeout;
  $("#searchInput").keypress(function(e) {
    clearTimeout(timeout)
    var that = $(this);
    timeout = setTimeout(function() {
      if (sessionStorage) {
        sessionStorage.searchInput = that.val()
      }
      search(that.val())
    }, 800);
  });

  var initSearch = "arnaudke"
  if (sessionStorage && sessionStorage.searchInput) {
    console.log("Search: " + sessionStorage.searchInput)
    $("#searchInput").val(sessionStorage.searchInput);
    initSearch = sessionStorage.searchInput
  }
  search(initSearch)

  startTimer('updateTweets', 2000, updateTweets);
});

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
    startTimer('autoRefresh', 4000, queryTwitter, data.refresh_url);
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

function appendTweets(data) {
  $.map(data['results'], function(obj, index) {
    // add created_from value
    obj['created_from'] = moment(obj['created_at']).fromNow()
    obj['added_at'] = moment().toDate();

    if (obj.entities.hashtags) console.log(obj.entities.hashtags)
    var entities = obj.entities.urls.concat(obj.entities.hashtags, obj.entities.user_mentions).sort(function(a, b) {
      return a.indices[0] - b.indices[0];
    })
    fillEntities(obj, entities);

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
  clearTimer('autoRefresh')
  container.isotope('remove', container.children());
  queryTwitter("q=" + encodeURI(value));
}
