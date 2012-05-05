;
var URI_REGEX = /https?:\/\/[-a-zA-Z0-9+&@#\/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#\/%=~_|]/g
var LINK_REGEX = /[#@]{1}[\w_]+/g
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

  if (sessionStorage && sessionStorage.searchInput) {
    $("#searchInput").val(sessionStorage.searchInput);
    search(sessionStorage.searchInput)
  }

  startTimer('updateTweets', 2000, updateTweets);
});

function queryTwitter(params) {
  if (!params.match(/^\?/)) {
    params = "?" + params
  }
  $.getJSON("http://search.twitter.com/search.json" + params + "&callback=?", handleResponse).error(handleError);
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
  var maxItem = 50;
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

    // Add anchor
    replaceInText(obj, URI_REGEX, function(match) {
      return '<a href="' + match + '">' + match + '</a>';
    });

    // Link for @ or #
    replaceInText(obj, LINK_REGEX, function(match) {
      return '<a href="https://twitter.com/#!/search/' + encodeURI(match) + '">' + match + '</a>';
    });
  });

  // Rendering
  var tweets = ich.tweet(data);
  container.prepend(tweets).isotope('reloadItems').isotope({
    sortBy: 'original-order'
  })
}

function startTimer(name, timeout, func, data) {
  timers[name] = setTimeout(function() {
    console.log("Starttime: "+ name)
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
  })
  container.isotope('reloadItems')
}

function search(value) {
  clearTimer('autoRefresh')
  container.isotope('remove', container.children());
  queryTwitter("q=" + encodeURI(value));
}
