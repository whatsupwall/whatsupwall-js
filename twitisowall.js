var URI_REGEX = /https?:\/\/[-a-zA-Z0-9+&@#\/%?=~_|!:,.;]*[-a-zA-Z0-9+&@#\/%=~_|]/

;$(function() {
    container = $("#container");

    // Init container
    container.isotope({
        // options
        itemSelector : '.item',
        layoutMode : 'masonry',
        masonry: {
            //columnWidth: 240
        }
    });

    queryTwitter("q=" + encodeURI("KohLanta"));
});

function queryTwitter(params) {
    if (!params.match(/^\?/)) {
        params = "?" + params
    }
    $.getJSON("http://search.twitter.com/search.json" + params + "&callback=?", 
        handleResponse).error(handleError);
}

function handleError(data) {
    console.log("Error")
}

function handleResponse(data) {
    if (data.error) {
        console.log("ERREUR")
    }
    //console.log(data)
    //container.empty();
    appendTweets(data)

    if(sessionStorage == null) {
        console.log("Session Storage not available ...")
        return;
    } else {
        sessionStorage.refresh_url = data.refresh_url
        startAutoUpdate();
    }

    var nbChild = container.children().size();
    var maxItem = 50;
    if (nbChild > maxItem) {
        container.isotope( 'remove', container.children().slice(maxItem));
    }
}

function appendTweets(data) {
    $.map(data['results'], function(obj, index) {
        var match = obj['text'].match(URI_REGEX)
        if (match) {
            var uri = match[0]
            obj['text'] = obj['text'].replace(uri, '<a href="'+uri+'">' + uri + '</a>');
        }
    });
    var tweets = ich.tweet(data);
    container.prepend(tweets).isotope('reloadItems').isotope({ sortBy: 'original-order' })
}

function startAutoUpdate() {
    setTimeout(function() {
        queryTwitter(sessionStorage.refresh_url);
    }, 4000);
}
