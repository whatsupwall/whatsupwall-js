;
var URI_REGEX = /https?:\/\/[-a-zA-Z0-9+&@#\/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#\/%=~_|]/
var autoUpdate;

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
  console.log(data)
  //console.log(data)
  //container.empty();
  appendTweets(data)
  if (data.refresh_url) {
    startAutoUpdate(data.refresh_url);
  }

  var nbChild = container.children().size();
  var maxItem = 50;
  if (nbChild > maxItem) {
    container.isotope('remove', container.children().slice(maxItem));
  }
}

function appendTweets(data) {
  $.map(data['results'], function(obj, index) {
    var match = obj['text'].match(URI_REGEX)
    if (match) {
      var uri = match[0]
      obj['text'] = obj['text'].replace(uri, '<a href="' + uri + '">' + uri + '</a>');
    }
  });
  var tweets = ich.tweet(data);
  container.prepend(tweets).isotope('reloadItems').isotope({
    sortBy: 'original-order'
  })
}

function startAutoUpdate(url) {
  autoUpdate = setTimeout(function() {
    queryTwitter(url);
  }, 4000);
}

function search(value) {
  clearTimeout(autoUpdate)
  container.isotope('remove', container.children());
  queryTwitter("q=" + encodeURI(value));
}
