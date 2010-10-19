;
if (typeof FORJ === "undefined") var FORJ = {
    config: {
        thread_list_container: $("#threadspane"),
        posts_container: $("#postspane"),
        maxposts: 100,
        current_thread: 0,
        precache: false,
        posts_url: "/posts/",
        threads_url: "/threads/",
        reply_url: "/posts/new?reply_to=",
        post_fragment: document.createDocumentFragment()
    },

    folders: [],
    threads: [],
    posts: []
}

FORJ.getThread = function(thread_id) {
    // Returns a thread object with the given id, assuming it's in the cache.
    // If not, ideally I want to async fetch it, but I'm unsure how to let
    // the caller know the return value.
    for (var i = 0, l = FORJ.threads.length; i < l; i++) {
        if (FORJ.threads[i].id === thread_id) {
            return FORJ.threads[i];
        }
    }
};

FORJ.loadThreadList = function() {
    // Loads the first 5 threads in each folder

    FORJ.threads = [];
    var _fetched = function(thread_data) {
        // Callback that fills FORJ.folders[] and .threads[]
        for (var i = 0, l = thread_data.length; i < l; i++) {
            FORJ.threads.push(thread_data[i]);
        }
    };
}

FORJ.showThread = function(i) {
    // Loads a new thread and renders it in the posts pane.
    var t = FORJ.getThread(i);
    FORJ.posts = [];
    FORJ.config.posts_container.empty().
        append($("<h2/>").
            text(t.name).
            addClass("thread_title")).
        append($("<div/>").
            text("Loading thread...").
            addClass("thread_loading"));
    
    FORJ.showPosts(i, 0, t.post_count < 50 ? t.post_count : 50);
};

FORJ.showPosts = function(thread_id, offset, limit) {
    // Async-requests the specified posts.
    // Eventually this will only fetch posts not already cached, but
    // for now it just fetches what it's told.

    var _fetched = function(post_data) {
        // Callback that renders the posts sent from the server
        FORJ.posts = post_data;
        var $post;
        var reply_url = "";

        FORJ.config.posts_container.children("h2").first().

        for (var i = 0, l = FORJ.posts.length; i < l, i++) {
            var p = FORJ.posts[i];
            $post = $(FORJ.config.post_fragment).clone();
            $post.find(".post_head_fromto").
                append(document.createTextNode("From: ")).
                append($("<a/>").href("#").text(p.from)).
                append("<br/>").
                append(document.createTextNode("To: ")).
                append($("<a/>").href("#").text(p.to));
            
            $post.find(".post_head_info").
                append(document.createTextNode(p.date)).
                append("<br/>").
                append(document.createTextNode([
                    p.index,
                    "of",
                    post_data.count].join(" ")));
            // NOTE: should the thread's post count be loaded from the server
            // every time that thread is loaded? If it's different to the one
            // returned by getThread().post_count, the latter should be
            // updated.
            
            $post.find(".post_body").html(p.body);
            $post.find(".post_sig").html(p.sig);
            
            reply_url = FORJ.config.reply_url + p.post_index;
            $post.find(".post_foot_reply").attr("href", reply_url);
            $post.find(".post_foot_quote").
                attr("href", reply_url + "&quote=true");

        } // for (i to FORJ.posts.length)

    }; // _fetched()

    $("<h2/>").
        text("Loading thread...").
        addClass("thread_loading").
        appendTo(FORJ.config.posts_container);

    var url = FORJ.config.posts_url + thread_id;
    url += ["?offset=", offset, "&limit=", limit].join("");
    console.log("URL fetched: ", url);
    $.getJSON(url, _fetched);
};


// Initialise the FORJ application
FORJ.init = function(config) {
    // Load post template
    $(FORJ.config.post_fragment).load("/post_fragment.html");
    
    // Add whatever's in the supplied 'config' parameter to our existing
    // FORJ.config object.
    if (config && typeof(config) == "object") {
        $.extend(FORJ.config, config);
    }
};

$(document).ready(FORJ.init);
