# whatsupwall

## Intro

Another automatic Twitter wall with lots of great javascript libraries to enhance your presentation.
You may look what it looks like following my gh-pages: http://akervern.github.com/whatsupwall/

## Libraries
 * [ICanHaz.js](http://icanhazjs.com/): a really nice client-side templating using [{{ mustache }}](http://mustache.github.com/). (MIT)
 * [jQuery](http://jquery.org): Who don't know? (MIT)
 * [Moment.js](http://momentjs.com/): a so nice javascript date library. (MIT)
 * [Isotope](http://isotope.metafizzy.co/): a jQuery plugin for magical layout. (licence: [see website](http://isotope.metafizzy.co/docs/license.html))

## How to use
 * required all those dependencies
 * Create or re-use two templates like into `index.xhtml`
 * In your javascript: `$("#myid").twitisotope()`
 * That's all ... :)

## Module parameter

jQuery module parameters:
```javascript
    updateTime: 2000, //time to update time ago from tweets
    refreshTime: 4000, //time to ask the tweets refresh
    inputValue: "", //force an input value, when using this parameter, the toolbar will not be build
    defaultValue: "arnaudke", //default value displayed when no inputValue, the toolbar will be built in this case
    rpp: 35, //max nb of tweets returned by a refresh
    
    toolbarOpts: {
      template: {}, //template parameters
      init: defaultToolbarInit //function to be called after rendering the template
    }
```