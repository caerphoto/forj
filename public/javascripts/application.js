;
if (typeof console === "undefined") {
    var console = {
        // Very basic reproduction of Chrome/Firebug's console window
        // Assumes there is an element called "log"; does nothing if not
        log: function() {
                 return;
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
        panes: undefined,
        buttons: $("input:submit"),
        page_header: $("#header"),
        page_footer: $("#footer"),
        threads_pane: $("#threadspane"),
        folder_list: $("#folder_list"),
        posts_pane: $("#postspane"),
        thread_title: $("#thread_title"),
        posts_container: $("#posts_container"),
        post_fragment: $("#post_template"),
        replybox: $("#replybox"),
        replybox_thread_title: $("#replybox_thread_title"),
        reply_text: $("#replybox texarea").first(),
        thread_loading_msg: $("#thread_loading_msg"),
        post_preview: undefined,
        btnNewFolder: $("#btnNewFolder"),
        btnNewThread: $("#btnNewThread"),
        btnPostReply: $("#btnPostReply"),
        btnCancelReply: $("#btnCancelReply"),
        selReplyTo: $("#selReplyTo"),
        selThreadFolder: $("#selThreadFolder"),
        showdown: Attacklab ? new Attacklab.showdown.converter() : undefined,

        showReplyBox: function(in_post, new_thread) {
            var show_speed;
            var $element;

            if (in_post) {
                show_speed = 100;
                $element = in_post;//.children(".post_foot");
                FORJ.ui.btnCancelReply.button("enable");

                FORJ.setData(FORJ.ui.replybox, FORJ.getData(in_post));

                var u = FORJ.config.editing_post ?
                    FORJ.getData(in_post).to_user_id :
                    FORJ.getData(in_post).user_id;
                FORJ.ui.selReplyTo.val(u);
            } else {
                show_speed = 0;
                $element = FORJ.ui.posts_container;
                FORJ.ui.btnCancelReply.button(new_thread ? "enable" : "disable");
                FORJ.ui.selReplyTo.val(0);
            }

            FORJ.ui.replybox.fadeTo(0, 1).
                hide().
                detach().
                insertAfter($element).
                slideDown(show_speed, function() {
                    if (in_post) {
                        FORJ.ui.replybox.find("textarea").focus();
                        FORJ.scrollToPost(in_post);
                    }
                });
        },

        hideReplyBox: function() {
            FORJ.ui.btnPostReply.button("enable");
            FORJ.ui.replybox.slideUp(100, function() {
                FORJ.setData(FORJ.ui.replybox);
                FORJ.ui.showReplyBox();
            });
        }
    },
    config: {
        default_post_data: {
            user_id: 0,
            to_user_id: 0,
            post_index: 0,
            id: 0,
            body: ""
        },
        maxposts: 100,
        MAX_POST_LENGTH: 9001,
        current_thread: 0, previous_thread: 0,
        editing_post: undefined,
        post_preview_target: ".post_body",
        current_user: {
            id: parseInt(($("#sign input").val()).slice(1), 10),
            isAdmin: ($("#sign input").val()).slice(0, 1) === "A"
        },
        precache: false,
        delete_post_url: "/delete_post/",
        edit_post_url: "/edit_post/",
        posts_url: "/posts",
        users_url: "/users",
        threads_url: "/msg_threads",
        new_folder_url: "/folders",
        reply_url: "/posts?reply_to="
    },

    folders: [],
    threads: [],
    post_cache: {}
}; // if (FORJ is undefined)

FORJ.setData = function($obj, data) {
    // Set post-related data on $obj, using defaults if no second parameter
    // is defined.
    if (data) {
        $obj.data("post_data", data);
    } else {
        $obj.data("post_data", FORJ.config.default_post_data);
    }
};

FORJ.getData = function($obj) {
    return $obj.data("post_data") || FORJ.config.default_post_data;
};

FORJ.markup = function(inp) {
    // Converts the Markdown-formatted input into sanitised HTML
    if (typeof inp === "string") {
        // Convert numeric HTML character codes into their actual characters,
        // to prevent stuff like 'p&#111;sition: absolute'
        inp = FORJ.ui.showdown.makeHtml(inp || " ");
        inp = inp.replace(/&#(\d+);/g, function(m, n) {
            return String.fromCharCode(n);
        });

        // Remove any references to 'position: absolute' etc. within the
        // 'style' section of an HTML tag
        inp = inp.replace(/(<.+?style\s*?=\s*?")(.*?)(position\s*?:\s*?(absolute|relative|fixed);?)(.*?">)/gi,
            "$1$2$5");

        // Convert <script> to HTML character escaped plain text
        return inp.replace(/<(\/)?script/gi, "&lt;$1script");
    } else {
        return "";
    }
}; // FORJ.markup()

FORJ.getThread = function(thread_id) {
    // Returns a thread object with the given id, assuming it's in the cache.
    // If not, ideally I want to async fetch it, but I'm unsure how to let
    // the caller know the return value. For now it just returns undefined.
    for (var i = 0, l = FORJ.threads.length; i < l; i++) {
        if (FORJ.threads[i].id === thread_id) {
            return FORJ.threads[i];
        }
    }
}; // FORJ.getThread()

FORJ.getFolderFromId = function(folder_id) {
    // Returns the jQuery object that represents the folder with the given ID
    var result = $("#uncat_threads");
    FORJ.ui.folder_list.children.each(function(i) {
        if ($(this).data("id") === folder_id) {
          result = $(this);
          return false;
        }
    });
    return result;
}; // FORJ.getFolderFromId()

FORJ.scrollToPost = function($post) {
    // Supposedly scrolls to the given post, but doesn't actually work very
    // well due to the moving about of the replybox messing with the size of
    // the scrollable area.
    var offset = 100;
    var pos = FORJ.ui.replybox.position().top -
        (FORJ.ui.replybox.parent().position().top || 0) -
        offset;
    console.log("Pos:", pos);

    pos = pos < 0 ? 0 : pos;
    FORJ.ui.posts_pane.scrollTo(pos, 200);
}; // FORJ.scrollToPost()

FORJ.resetReplyBox = function() {
    FORJ.ui.replybox_thread_title.find("input").val("");
    $("#replybox textarea").val("");
    FORJ.ui.replybox.find("textarea").trigger("keyup");
}; // FORJ.resetReplyBox()

FORJ.showThread = function(i) {
    // Loads a new thread and renders it in the posts pane.
    FORJ.ui.replybox_thread_title.hide();
    var t = FORJ.getThread(i);
    if (!t) {
        alert("Tried to load thread of id " + i + " but not in cache.");
        return;
    }

    FORJ.posts = [];
    FORJ.ui.thread_loading_msg.fadeIn(100);
    FORJ.ui.thread_title.show().text(t.title);
    FORJ.ui.replybox.detach();
    FORJ.showPosts(i, 0, t.post_count < 50 ? t.post_count : 50);
}; // FORJ.showThread()

FORJ.getPostFromId = function(id) {
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

FORJ.getCacheIndexFromId = function(id) {
    var result;
    _(FORJ.post_cache.posts).each(function(el, i) {
        //
        if (el.id == id) {
            result = i;
            _.breakLoop();
        }
    });
    return result
}; // FORJ.getCacheIndexFromId()

FORJ.addPost = function(p, opts) {
    var $post = $(FORJ.ui.post_fragment).clone();
    var reply_url = "";
    $post.find(".post_head_from").
        attr("href", [FORJ.config.users_url, p.from.id].join("/")).
        text(p.from.name);
    if (p.to_user.id === 0) {
        $post.find(".post_head_to").after(
            document.createTextNode(p.to_user.name));
        $post.find(".post_head_to").remove();
    } else {
        $post.find(".post_head_to").
            attr("href", p.to_user.id ? 
                [FORJ.config.users_url, p.to_user.id].join("/") :
                ""
                ).
            text(p.to_user.name);
    }

    $post.find(".post_head_date").
        text(p.date);
    $post.find(".post_head_index").
        text(p.post_index + 1);
    $post.find(".post_head_reply_index").
        text(p.to_index + 1);

    $post.find(".post_body").html(FORJ.markup(p.body));
    $post.find(".post_sig").html(FORJ.markup(p.from.sig));

    reply_url = FORJ.config.reply_url + p.post_index;
    $post.find(".post_foot_reply").attr("href", reply_url);
    $post.find(".post_foot_quote").
        attr("href", reply_url + "&quote=true");

    $post.find(".post_foot_delete").
        attr("href", FORJ.config.delete_post_url + p.id);

    // Remove Edit and Delete links if the post is not the current user's,
    // and the current user is not an admin.
    // Note: this check is also done server-side, so even if someone sends a
    // request via hax0ry means, it still won't work - the client-side link
    // removal is more just a UI thing than any kind of real security.
    if (FORJ.config.current_user.id !== p.from.id &&
        !FORJ.config.current_user.isAdmin) {
        $post.find(".post_foot_editlinks").remove();
    }

    FORJ.setData($post, {
        user_id: p.from.id,
        to_user_id: p.to_user.id,
        post_index: p.post_index,
        id: p.id,
        body: p.body
    });

    if (typeof opts === "object" && opts.insert_after) {
        $post.insertAfter(opts.insert_after);
        if (opts.remove_previous) {
            opts.insert_after.remove();
        }
    } else {
        $post.appendTo(FORJ.ui.posts_container);
    }

    if (opts && opts.scroll) {
        console.log("Scrolling to: ", $post.position().top);
        FORJ.scrollToPost($post);
    }
}; // FORJ.addPost()

FORJ.deletePost = function(post_id) {
    if (FORJ.getData(FORJ.getPostFromId(post_id)).post_index === 0) {
        // Callback for thread/post deletion $.get()
        var _deleted_thread = function(response) {
            console.log("Deleting: post_id: ", post_id, "and thread id: ",
                FORJ.config.current_thread);
            if (response === "WRONG_USER") {
                // This is unlikely to happen normally
                alert("Sorry, you're not authorised to delete this thread.");
                return;
            }

            FORJ.ui.replybox.detach();
            FORJ.ui.posts_container.empty();
            FORJ.ui.thread_title.text("");

            // Find and remove thread from list
            $(".thread_list_item").each(function(i, $item) {
                if ($(this).data("id") === FORJ.config.current_thread) {
                    $(this).fadeTo(200, 0.01, function() {
                        $(this).slideUp(100, function () {
                            $(this).remove();
                        });
                    });
                    return false; // halt thread item iteration
                }
            });

        }; // _deleted_thread()

        if (window.prompt("Deleting the first post of a thread will also delete the entire thread.\n\nAre you sure you want to do this?\n\nType 'delete' into the box below to confirm:").toLowerCase() === "delete") {
            var url = FORJ.config.delete_post_url + post_id;
            $.get(url, _deleted_thread);
        }
    } else {
        var _deleted = function(next_post_id) {
            switch (next_post_id) {
                case "WRONG_USER": {
                    alert("Sorry, you're not authorised to delete this post.");
                    return;
                };
                default: {
                    console.log("Deleting: post_id: ", post_id, ", next id: ",
                        next_post_id);
                    FORJ.getPostFromId(post_id).fadeTo(200, 0.01, function() {
                        $(this).slideUp(100, function() {
                            $(this).remove();
                            if (next_post_id !== -1) {
                                // Commenting this out until I can be bothered
                                // making it work properly
                                //FORJ.scrollToPost(FORJ.getPostFromId(next_post_id));
                            }
                        });
                    });
                } // case default
            } // switch (next_post_id)
        }; // _deleted()
        if (window.confirm("Are you sure you want to delete this post?\n\n" +
            "Post number: " +
            (FORJ.getData(FORJ.getPostFromId(post_id)).post_index + 1))) {
            var url = FORJ.config.delete_post_url + post_id;
            $.get(url, _deleted);
        }
    } // if post_index === 0
};

FORJ.showPosts = function(thread_id, offset, limit) {
    // Async-requests the specified posts.
    // Eventually this will only fetch posts not already cached, but
    // for now it just fetches what it's told.

    var _fetched = function(post_data) {
        // Callback that renders the posts sent from the server
        FORJ.ui.posts_container.empty(); // will need deleting once we start to 
                                      // append posts to the current thread
        console.log("post_data.length: ", post_data.posts.length);
        var time_start = new Date();

        _(post_data.posts).each(function(p) {
            FORJ.addPost(p, post_data.count);
        }); // FORJ.posts.each()

        var time_end = new Date();
        console.log("Time taken: ", time_end - time_start, "ms");

        FORJ.post_cache = post_data;
        FORJ.config.current_thread = thread_id;

        FORJ.ui.thread_loading_msg.fadeOut(100);
        FORJ.ui.showReplyBox();
        FORJ.ui.posts_container.scrollTo(0);
    }; // _fetched()

    console.log("Cur thread: ", FORJ.config.current_thread,
        ", thread_id: ", thread_id);
    if (thread_id === FORJ.config.current_thread) {
        _fetched(FORJ.post_cache);
    } else {
        var url = FORJ.config.posts_url + "?thread=";
        url += [thread_id, "&offset=", offset, "&limit=", limit].join("");
        console.log("URL fetched: ", url);
        $.getJSON(url, _fetched);
    }
}; // FORJ.showPosts()

FORJ.populateUserLists = function(users) {
    // Fills in the temporary <select>s used for testing
    var $user_list = $("#replybox select");
    _(users).each(function(user) {
        $user_list.append($("<option/>").
            val(user.id).
            text(user.name)
        );
    });
}; // FORJ.populateUserLists()

FORJ.populateThreadsList = function(folders) {
    // Fills the temporary threads list.
    var $folder;

    FORJ.threads = [];
    FORJ.ui.folder_list.empty();
    FORJ.ui.selThreadFolder.empty();

    _(folders).each(function(folder) {
        var new_folder = $("<li />").
            data("id", folder.id).
            addClass("folder_list_item").
            append($("<a />").
                addClass("folder_name").
                text(folder.name).
                append($("<span />").
                    addClass("item_count").
                    text(" " + folder.thread_count +
                         (folder.thread_count === 1 ? " thread" : " threads")))).
            appendTo(FORJ.ui.folder_list);

        FORJ.ui.selThreadFolder.append(
            $("<option />").
            text(folder.name).
            val(folder.id)
        );

        var $thread_list = $("<ul />").
            addClass("thread_list").
            appendTo(new_folder);

        _(folder.threads).each(function(thread) {
            var new_item = $("<li/>").
                addClass("thread_list_item bl").
                data("id", thread.id).
                append($("<a/>").
                    attr("href", [FORJ.config.threads_url, thread.id].join("/")).
                    text(thread.title)).
                append($("<span/>").
                    addClass("item_count").
                    text(" " + thread.post_count +
                         (thread.post_count === 1 ? " post" : " posts")));
            if (thread.id === FORJ.config.current_thread) {
                new_item.addClass("current_thread");
            }
            $thread_list.append(new_item);
            FORJ.threads.push(thread);
        }); // folder.threads.each()
    }); // folders.each()
    FORJ.folders = folders;
}; // FORJ.populateThreadsList()

FORJ.newPostCallback = function(newpost) {
    FORJ.ui.replybox_thread_title.hide();
    if (newpost.post_index == 0) {
        $.get(FORJ.config.threads_url, FORJ.populateThreadsList);
        FORJ.config.current_thread = newpost.thread;
    }
    FORJ.resetReplyBox();
    FORJ.ui.hideReplyBox();
    // remove_previous can be set to true in all cases since it doesn't get
    // checked unless insert_after is also true.
    FORJ.addPost(newpost, { scroll: true,
                            insert_after: FORJ.config.editing_post,
                            remove_previous: true });
    FORJ.config.editing_post = undefined;
};

FORJ.lnkReplyClick = function(event) {
    event.preventDefault();
    FORJ.ui.showReplyBox($(this).parents(".post"));
}; // FORJ.lnkReplyClick()


FORJ.lnkEditClick = function(event) {
    event.preventDefault();
    var post = $(this).parents(".post");
    FORJ.config.editing_post = post;
    FORJ.ui.replybox.find("textarea").val(FORJ.getData(post).body);
    FORJ.ui.showReplyBox(post);
    FORJ.ui.replybox.find("textarea").trigger("keyup");
    post.hide();
}; // FORJ.lnkEditClick()

FORJ.lnkDeleteClick = function(event) {
    event.preventDefault();
    console.log(FORJ.getData($(this).parents(".post")));
    FORJ.deletePost(FORJ.getData($(this).parents(".post")).id);
};

FORJ.postTextChange = function(sig) {
    // Updates post length counter, changing its class to "post_too_long" if
    // necessary.
    var txt = $(this).val() || " ";
    var length_thingy = $("#post_length");
    length_thingy.text(txt.length);
    if (txt.length > FORJ.config.MAX_POST_LENGTH) {
        length_thingy.addClass("field_with_error");
    } else {
        length_thingy.removeClass("field_with_error");
    }

    window.setTimeout(function() {
        var h = FORJ.markup(txt);
        FORJ.ui.post_preview.find(FORJ.config.post_preview_target).html(h);
    }, 0);
}; // FORJ.postTextChange()

FORJ.btnPostReplyClick = function() {
    FORJ.ui.replybox.fadeTo(100, 0.5);
    FORJ.ui.btnPostReply.button("disable");

    var url = "";
    if (FORJ.config.current_thread === 0) {
        // Starting a new thread
        var title = FORJ.ui.replybox_thread_title.find("input").val();
        url = FORJ.config.threads_url;
        url += [
            "?title=", encodeURIComponent(title),
            "&folder=", FORJ.ui.selThreadFolder.val()
        ].join("");
    } else {
        var post_data = FORJ.getData(FORJ.ui.replybox);

        if (FORJ.config.editing_post) {
            url = FORJ.config.edit_post_url + post_data.id;
        } else {
            url = FORJ.config.reply_url;
            url += [
                FORJ.ui.selReplyTo.val(),
                "&thread=", FORJ.config.current_thread,
                "&reply_index=", post_data.post_index || 0,
                "&post_index=", FORJ.config.current_thread ? 1 : 0
            ].join("");
        }
    }

    var txt = (FORJ.ui.replybox.find("textarea").val()).slice(0,
        FORJ.config.MAX_POST_LENGTH);

    $.post(url, { textData: txt }, FORJ.newPostCallback);
}; // FORJ.btnPostReplyClick()

FORJ.btnCancelReplyClick = function() {
    FORJ.ui.replybox_thread_title.hide();
    if (FORJ.config.previous_thread) {
        FORJ.config.current_thread = FORJ.config.previous_thread;
        FORJ.config.previous_thread = 0;
        FORJ.showThread(FORJ.config.current_thread);
    } else {
        if (FORJ.config.editing_post) {
            FORJ.config.editing_post.show();
            FORJ.config.editing_post = undefined;
        }
        FORJ.resetReplyBox();
        FORJ.ui.hideReplyBox();
    }
};

FORJ.lnkThreadClick = function(event) {
    event.preventDefault();
    $(".current_thread").removeClass("current_thread");
    $(this).addClass("current_thread");
    FORJ.config.current_thread = 0; // force reload of thread when clicked
    FORJ.showThread($(this).data("id"));
}; // FORJ.lnkThreadClick()

FORJ.lnkFolderClick = function(event) {
    var folder = $(this);
    if (folder.hasClass("folder_contracted")) {
        folder.removeClass("folder_contracted");
        folder.next().slideDown(200);
    } else {
        folder.addClass("folder_contracted");
        folder.next().slideUp(200);
    }

}; // FORJ.lnkFolderClick()

FORJ.btnNewThreadClick = function() {
    FORJ.config.previous_thread = FORJ.config.current_thread;
    FORJ.config.current_thread = 0;

    FORJ.ui.thread_title.hide();

    FORJ.ui.replybox.detach();
    FORJ.ui.posts_container.empty();
    FORJ.ui.showReplyBox(undefined, true);

    FORJ.ui.replybox_thread_title.show();
    FORJ.ui.replybox_thread_title.find("input").focus();
}; // FORJ.btnNewThreadClick()

FORJ.btnNewFolderClick = function() {
    var folder_name = prompt("What would you like to call the new folder?");
    if (folder_name) {
        var _newFolder = function(folder) {
            FORJ.folders.push(folder);
            FORJ.populateThreadsList(FORJ.folders);
        }; // newFolderCallback()

        var url = [FORJ.config.new_folder_url,
            "?name=", encodeURIComponent(folder_name)].join("");
        $.post(url, _newFolder);
    } // if (folder_name)
}; // FORJ.btnNewFolderClick()

FORJ.logoClick = function() {
    window.location = "/";
};

FORJ.layoutSetup = function() {
    // Resized panes so the app fills the window.
    // NOTE: the Chrome extension SmoothScroll has a bug where it won't resize
    // the underlay <div> it creates if the window is sized vertically smaller
    // than it was previously. This has the unfortunate effect of allowing the
    // window to be scrolled even if it doesn't look like it should.

    var threads_pane_margins = FORJ.ui.threads_pane.outerHeight(true) -
        FORJ.ui.threads_pane.height();
    FORJ.ui.threads_pane.height(
        $(window).height() - (FORJ.ui.page_header.outerHeight(true) +
        FORJ.ui.page_footer.outerHeight(true) + threads_pane_margins)
    );
    FORJ.ui.posts_pane.height(FORJ.ui.threads_pane.outerHeight());

    var o = FORJ.ui.posts_pane.offset();
    FORJ.ui.thread_loading_msg.
        show().
        offset(o).
        hide();
};

FORJ.lipsum = function() {
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget tempor lacus. Aenean condimentum sem velit. Nulla fringilla, ligula in fringilla dignissim, erat enim malesuada nibh, sit amet convallis lectus mi quis nibh. Suspendisse congue dolor diam. Phasellus faucibus dignissim ligula ut lacinia. Phasellus mattis luctus elit ut porta. Cras.";
}; // FORJ.lipsum()

FORJ.createPostPreview = function(sig) {
    FORJ.config.post_preview_target = sig ? ".post_sig" : ".post_body";
    $("#max_post_length").text(FORJ.config.MAX_POST_LENGTH);
    FORJ.ui.post_preview = FORJ.ui.post_fragment.clone();
    FORJ.ui.post_preview.removeClass("hidden").
        addClass("post_preview").
        removeAttr("id");
    FORJ.ui.post_preview.find(".post_head").remove();
    FORJ.ui.post_preview.find(".post_foot").remove();
    if (sig) {
        FORJ.ui.post_preview.find(".post_body").
            text(FORJ.lipsum()).
            addClass("sig_body_preview");
    } else {
        FORJ.ui.post_preview.find(".post_sig").remove();
    }
}; // FORJ.createPostPreview()

// Initialise the FORJ application
FORJ.initForum = function(config) {
    // Add whatever's in the supplied 'config' parameter to our existing
    // FORJ.config object.
    if (config && typeof(config) == "object") {
        $.extend(FORJ.config, config);
    }

    console.log("Starting application...");

    FORJ.ui.posts_container.
        delegate(".post_foot_reply", "click", FORJ.lnkReplyClick).
        delegate(".post_foot_delete", "click", FORJ.lnkDeleteClick).
        delegate(".post_foot_edit", "click", FORJ.lnkEditClick);
    FORJ.ui.posts_pane.
        delegate("#replybox textarea", "keyup", FORJ.postTextChange);
    FORJ.ui.folder_list.
        delegate(".thread_list_item", "click", FORJ.lnkThreadClick).
        delegate(".folder_name", "click", FORJ.lnkFolderClick);

    FORJ.ui.btnPostReply.button().click(FORJ.btnPostReplyClick);
    FORJ.ui.btnCancelReply.button().click(FORJ.btnCancelReplyClick);
    FORJ.ui.btnNewThread.button().click(FORJ.btnNewThreadClick);
    FORJ.ui.btnNewFolder.button().click(FORJ.btnNewFolderClick);

    FORJ.createPostPreview();
    FORJ.ui.post_preview.insertAfter(FORJ.ui.replybox.find("#replybox_options"));

    FORJ.ui.replybox_thread_title.hide();
    FORJ.ui.replybox.hide();

    FORJ.layoutSetup();
    $(window).resize(FORJ.layoutSetup);

    $.get(FORJ.config.users_url, FORJ.populateUserLists);
    $.get(FORJ.config.threads_url, FORJ.populateThreadsList);

    // Load post template
    FORJ.ui.post_fragment.detach().
        removeAttr("id").
        removeClass("hidden");
    console.log("Current user: ", FORJ.config.current_user.id);
};

FORJ.initOther = function() {
    FORJ.ui.buttons.button();
    FORJ.config.MAX_POST_LENGTH = 255;

    // Create a clone of #post_fragment, insert it before the original, then
    // remove the original
    FORJ.createPostPreview(true); // true will point the preview updater at .post_sig
    FORJ.ui.post_preview.insertBefore(FORJ.ui.post_fragment);
    FORJ.ui.post_fragment.remove();

    $("#sigeditor").delegate("textarea", "keyup", FORJ.postTextChange);
    // trigger an initial keyup as the textarea gets filled automatically by
    // the server
    $("#sigeditor textarea").trigger("keyup");
};

$(document).ready(function() {
    if (document.getElementById("threadspane")) {
        FORJ.initForum();
    } else {
        FORJ.initOther();
    }
});
