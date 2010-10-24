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
        posts_pane: $("#postspane"),
        posts_container: $("#posts_wrapper"),
        post_fragment: $("#post_template"),
        replybox: $("#replybox"),
        btnNewThread: $("#btnNewThread"),
        btnPostReply: $("#btnPostReply"),
        btnCancelReply: $("#btnCancelReply"),
        selReplyTo: $("#selReplyTo"),
        selReplyFrom: $("#selReplyFrom"),

        showReplyBox: function(in_post) {
            if (in_post) {
                FORJ.ui.btnPostReply.button("enable");
                FORJ.ui.btnCancelReply.button("enable");
                FORJ.scrollToPost(in_post);
                FORJ.ui.replybox.fadeTo(0, 1).
                    hide().
                    detach().
                    insertAfter(in_post.children(".post_foot")).
                    slideDown(200);

                FORJ.setData(FORJ.ui.replybox, FORJ.getData(in_post));
                FORJ.ui.selReplyTo.val(FORJ.getData(in_post).user_id);
                FORJ.ui.replybox.find("textarea").focus();
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
            FORJ.ui.replybox.slideUp(100, function() {
                FORJ.ui.replybox.find("textarea").val("");
                FORJ.setData(FORJ.ui.replybox);
                FORJ.ui.showReplyBox();
            });
        }
    },
    config: {
        default_post_data: { user_id: 0, post_index: 0, id: 0 },
        maxposts: 100,
        current_thread: 0,
        precache: false,
        delete_post_url: "/delete_post/",
        posts_url: "/posts",
        users_url: "/users",
        threads_url: "/msg_threads",
        reply_url: "/posts?reply_to="
    },

    folders: [],
    threads: [],
    posts: []
}; // if (FORJ is undefined)

FORJ.setData = function($obj) {
    // Set post-related data on $obj, using defaults if no second parameter
    // is defined.
    if (arguments[1]) {
        $obj.data("post_data", arguments[1]);
    } else {
        $obj.data("post_data", FORJ.config.default_post_data);
    }
};

FORJ.getData = function($obj) {
    return $obj.data("post_data") || FORJ.config.default_post_data;
};

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

FORJ.scrollToPost = function($post) {
    FORJ.ui.posts_pane.scrollTo($post.position().top + FORJ.ui.posts_pane.scrollTop(), 200);
}; // FORJ.scrollToPost()

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

FORJ.getPost = function(id) {
    // Returns the $(.post) object with the given id as its data, if found.
    // Otherwise returns undefined.
    var result;
    $(".post").each(function(i, el) {
        if (FORJ.getData($(el)).id === id) {
            result = $(el);
            return false;
        }
    });
    return result;
}; // FORJ.getPost()

FORJ.addPost = function(p, scroll) {
    var $post;
    var reply_url = "";
    $post = $(FORJ.ui.post_fragment).clone();
    $post.find(".post_id").text(p.id);
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
    $post.find(".post_head_count").
        text("0");//post_data.count);
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
    $post.find(".post_foot_delete").
        attr("href", FORJ.config.delete_post_url + p.id);
    FORJ.setData($post, {
        user_id: p.from.id,
        post_index: p.post_index,
        id: p.id
    });
    $post.appendTo(FORJ.ui.posts_container);

    if (scroll) {
        console.log("Scrolling to: ", $post.position().top);
        FORJ.scrollToPost($post);
    }
}; // FORJ.addPost()

FORJ.deletePost = function(post_id) {
    if (FORJ.getData(FORJ.getPost(post_id)).post_index === 0) {
        alert("Unable to delete first post in a thread just yet. Coming soon!");
        return;
    }

    var _deleted = function(next_post_id) {
        console.log("Deleting: post_id: ", post_id, ", next_post_id: ", next_post_id);
        if (next_post_id !== -1) {
            FORJ.getPost(post_id).fadeTo(200, 0.01, function() {
                $(this).slideUp(100, function() {
                    $(this).remove();
                    //FORJ.scrollToPost(FORJ.getPost(next_post_id));
                });
            });
        }
    }; // _deleted()
    var url = FORJ.config.delete_post_url + post_id;
    $.get(url, _deleted);
};

FORJ.showPosts = function(thread_id, offset, limit) {
    // Async-requests the specified posts.
    // Eventually this will only fetch posts not already cached, but
    // for now it just fetches what it's told.

    var _fetched = function(post_data) {
        // Callback that renders the posts sent from the server
        FORJ.posts = post_data.posts;
        console.log("post_data.length: ", post_data.posts.length);
        var time_start = new Date();

        _(FORJ.posts).each(function(p) {
            FORJ.addPost(p);
        }); // FORJ.posts.each()
        var time_end = new Date();
        console.log("Time taken: ", time_end - time_start);

        $(".thread_loading").remove();
        FORJ.ui.showReplyBox();
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
    FORJ.addPost(newpost, true);
};

FORJ.lnkReplyClick = function(event) {
    event.preventDefault();
    FORJ.ui.showReplyBox($(this).parents(".post"));
}; // FORJ.replyClick()

FORJ.lnkDeleteClick = function(event) {
    event.preventDefault();
    console.log($(this).parents(".post").data("post_data"));
    FORJ.deletePost(FORJ.getData($(this).parents(".post")).id);
};

FORJ.btnPostReplyClick = function() {
    FORJ.ui.replybox.fadeTo(100, 0.5);
    FORJ.ui.btnPostReply.button("disable");

    var post_data = FORJ.getData(FORJ.ui.replybox);
    console.log(post_data);
    var url = FORJ.config.reply_url;
    url += [FORJ.ui.selReplyTo.val(),
            "&reply_from=", FORJ.ui.selReplyFrom.val(),
            "&thread=", FORJ.config.current_thread,
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

FORJ.lnkThreadClick = function(event) {
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
        delegate(".post_foot_reply", "click", FORJ.lnkReplyClick).
        delegate(".post_foot_delete", "click", FORJ.lnkDeleteClick);
    FORJ.ui.folder_list.
        delegate(".thread_title a", "click", FORJ.lnkThreadClick);

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
