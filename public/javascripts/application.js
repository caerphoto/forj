;
if (typeof console === "undefined") {
    var console = {
        // Very basic reproduction of Chrome/Firebug's console window
        // Assumes there is an element called "log"; does nothing if not
        log: function() {
            var s = [];
            var elog = document.getElementById("log");
            if (elog) {
                for (var i = 0; i < arguments.length; i++) {
                    s.push(arguments[i]);
                }
                var p = document.createElement("p");
                var t = document.createTextNode(s.join(" "));
                p.appendChild(t);
                elog.appendChild(p);
                $(elog).scrollTop(elog.scrollHeight);
            }
        }
    }
} else {
    $("#log").remove();
} // if (console is undefined)

if (typeof FORJ === "undefined") var FORJ = {
    ui: {
        thread_list_container: $("#threadspane"),
        folder_list: $("#folder_list"),
        posts_container: $("#posts_wrapper"),
        post_fragment: $("#post_template"),
        replybox: $("#replybox"),
        btnNewThread: $("#btnNewThread"),
        btnPostReply: $("#btnPostReply"),
        btnCancelReply: $("#btnCancelReply"),
        selReplyTo: $("#selReplyTo"),
        selReplyFrom: $("#selReplyFrom"),

        showReplyBox: function(on_post) {
            FORJ.ui.replybox.find("textarea").val("");
            if (on_post) {
                FORJ.ui.btnPostReply.button("enable");
                FORJ.ui.btnCancelReply.button("enable");
                FORJ.ui.replybox.fadeTo(0, 1).
                    hide().
                    detach().
                    insertAfter($(on_post).parent()).
                    slideDown(200);

                FORJ.ui.replybox.data("post_data", $(on_post).data("post_data"));
                FORJ.ui.selReplyTo.val($(on_post).data("post_data").id);
            } else {
                FORJ.ui.btnPostReply.button("enable");
                FORJ.ui.btnCancelReply.button("disable");
                FORJ.ui.replybox.fadeTo(0, 1).
                    hide().
                    detach().
                    insertAfter(FORJ.ui.posts_container).
                    show();
            }
        },

        hideReplyBox: function() {
            FORJ.ui.replybox.hide;//slideUp(200);
            FORJ.ui.showReplyBox();
        }
    },
    config: {
        maxposts: 100,
        current_thread: 0,
        precache: false,
        posts_url: "/posts",
        users_url: "/users",
        threads_url: "/msg_threads",
        reply_url: "/posts?reply_to="
    },

    folders: [],
    threads: [],
    posts: []
} // if (FORJ is undefined)

FORJ.getThread = function(thread_id) {
    //return { id: 1, name: "Test Thread", post_count: 2 };
    // Returns a thread object with the given id, assuming it's in the cache.
    // If not, ideally I want to async fetch it, but I'm unsure how to let
    // the caller know the return value. For now it just returns undefined.
    for (var i = 0, l = FORJ.threads.length; i < l; i++) {
        if (FORJ.threads[i].id === thread_id) {
            return FORJ.threads[i];
        }
    }
}; // FORJ.getThread()

FORJ.loadThreadList = function() {
    // Loads the first 5 threads in each folder
    FORJ.threads = [];
    var _fetched = function(thread_data) {
        // Callback that fills FORJ.folders[] and .threads[]
        for (var i = 0, l = thread_data.length; i < l; i++) {
            FORJ.threads.push(thread_data[i]);
            console.log(thread_data[i]);
        }
    };
    $.getJSON(threads_url, _fetched);
}; // FORJ.loadThreadList()

FORJ.showThread = function(i) {
    // Loads a new thread and renders it in the posts pane.
    var t = FORJ.getThread(i);
    if (!t) {
        alert("Tried to load thread of id " + i + " but not in cache.");
        return;
    }

    FORJ.config.current_thread = t.id;
    FORJ.posts = [];
    FORJ.ui.posts_container.empty().
        append($("<div/>").
            text("Loading thread...").
            addClass("thread_loading"));
    $("#thread_title").text(t.name);
    FORJ.ui.replybox.detach(); 
    FORJ.showPosts(i, 0, t.post_count < 50 ? t.post_count : 50);
}; // FORJ.showThread()

FORJ.addPost = function(p) {
    var $post;
    var reply_url = "";
    $post = $(FORJ.ui.post_fragment).clone();
    $post.find(".post_head_from").
        attr("href", [FORJ.config.users_url, p.from.id].join("/")).
        text(p.from.name);
    $post.find(".post_head_to").
        attr("href", [FORJ.config.users_url, p.to_user.id].join("/")).
        text(p.to_user.name);

    $post.find(".post_head_date").
        text(p.date);
    $post.find(".post_head_index").
        text(p.post_index + 1);
    //$post.find(".post_head_count").
    //    text(post_data.count);
    
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
    $post.find(".post_foot a").data("post_data",
        { id: p.from.id,
          thread: p.thread });
    $post.appendTo(FORJ.ui.posts_container);

}; // FORJ.addPost()

FORJ.showPosts = function(thread_id, offset, limit) {
    // Async-requests the specified posts.
    // Eventually this will only fetch posts not already cached, but
    // for now it just fetches what it's told.

    var _fetched = function(post_data) {
        // Callback that renders the posts sent from the server
        FORJ.posts = post_data.posts;
        console.log("post_data.length: ", post_data.posts.length);
        var time_start = new Date();

        //for (var i = 0, l = FORJ.posts.length; i < l; i++) {
        _(FORJ.posts).each(function(p) {
            FORJ.addPost(p);
        }); // FORJ.posts.each()
        var time_end = new Date();
        console.log("Time taken: ", time_end - time_start);

        $(".thread_loading").remove();
        FORJ.ui.replybox.insertAfter(FORJ.ui.posts_container);
    }; // _fetched()

    var url = FORJ.config.posts_url + "?thread=";
    url += [thread_id, "&offset=", offset, "&limit=", limit].join("");
    console.log("URL fetched: ", url);
    $.getJSON(url, _fetched);
}; // FORJ.showPosts() 

FORJ.populateUserLists = function(users) {
    console.log(users);
    // Fills in the temporary <select>s used for testing
    var $user_list = $("#replybox select");
    _(users).each(function(user) {
        $user_list.append($("<option/>").
            val(user.id).
            text(user.name)
        );
    });
}; // FORJ.populateUserLists()

FORJ.populateThreadsList = function(threads) {
    console.log(threads);
    // Fills the temporary threads list. For now there is only one static
    // folder to which all threads are added.
    var $thread_list = $("#temp_thread_list");
    
    var folders = [];
    FORJ.threads = [];
    _(threads).each(function(thread) {
        $thread_list.append($("<li/>").
            addClass("thread_title").
            append($("<a/>").
                attr("href", [FORJ.config.threads_url, thread.id].join("/")).
                text(thread.title).
                data("id", thread.id)
            )
        );
        FORJ.threads.push(thread);
    });
    
}; // FORJ.populateThreadsList()

FORJ.newPostCallback = function(newpost) {
    FORJ.ui.hideReplyBox();
    FORJ.addPost(newpost);
};

FORJ.replyClick = function(event) {
    console.log($(this).data("post_data"));
    event.preventDefault();
    FORJ.ui.showReplyBox(this);
}; // FORJ.replyClick()

FORJ.btnPostReplyClick = function() {
    FORJ.ui.replybox.fadeTo(100, 0.5);
    FORJ.ui.btnPostReply.button("disable");

    var post_data = FORJ.ui.replybox.data("post_data");
    console.log(post_data);
    var url = FORJ.config.reply_url;
    url += [FORJ.ui.selReplyTo.val(),
            "&reply_from=", FORJ.ui.selReplyFrom.val(),
            "&thread=", post_data.thread,
            "&reply_index=", post_data.post_index,
            "&msg=", encodeURIComponent(FORJ.ui.replybox.find("textarea").
                val()),
            "&post_index=1" // for now at least
           ].join("");

    console.log(url);
    $.post(url, FORJ.newPostCallback);
}; // FORJ.btnPostReplyClick()

FORJ.btnCancelReplyClick = function() {
    FORJ.ui.hideReplyBox();
};

FORJ.threadClick = function(event) {
    event.preventDefault();
    FORJ.showThread($(this).data("id"));
}; // FORJ.threadClick()

FORJ.btnNewThreadClick = function() {
    // TODO 
}; // FORJ.btnNewThreadClick()

// Initialise the FORJ application
FORJ.init = function(config) {
    // Add whatever's in the supplied 'config' parameter to our existing
    // FORJ.config object.
    if (config && typeof(config) == "object") {
        $.extend(FORJ.config, config);
    }

    console.log("Starting application...");

    FORJ.ui.posts_container.
        delegate(".post_foot_reply", "click", FORJ.replyClick);
    FORJ.ui.folder_list.
        delegate(".thread_title a", "click", FORJ.threadClick);

    FORJ.ui.btnPostReply.button().click(FORJ.btnPostReplyClick);
    FORJ.ui.btnCancelReply.button().click(FORJ.btnCancelReplyClick);
    FORJ.ui.btnNewThread.button().click(FORJ.btnNewThreadClick);
    FORJ.ui.replybox.hide();

    $.get(FORJ.config.users_url, FORJ.populateUserLists);
    $.get(FORJ.config.threads_url, FORJ.populateThreadsList);

    // Load post template
    FORJ.ui.post_fragment.detach().
        removeAttr("id").
        removeClass("hidden");
};

$(document).ready(FORJ.init);
