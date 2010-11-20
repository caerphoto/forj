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

if (typeof FJ === "undefined") var FJ = {
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
        pt_fragment: $("#pt_template"),
        rbx: $("#rbx"),
        rbx_thread_title: $("#rbx_thread_title"),
        reply_text: $("#rbx texarea").first(),
        thread_loading_msg: $("#thread_loading_msg"),
        folders_loading_msg: $("#folders_loading_msg"),
        pt_preview: undefined,
        btnNewFolder: $("#btnNewFolder"),
        btnNewThread: $("#btnNewThread"),
        btnReloadThreadsList: $("#btnReloadThreadsList"),
        btnPostReply: $("#btnPostReply"),
        btnCancelReply: $("#btnCancelReply"),
        selReplyTo: $("#selReplyTo"),
        selThreadFolder: $("#selThreadFolder"),
        selThreadsView: $("#selThreadsView"),
        showdown: (function() {
            if (Attacklab) {
                return new Attacklab.showdown.converter();
            } else {
                return {
                    makeHtml: function(text) { return text }
                }
            }
        })(),

        showReplyBox: function(in_post, new_thread) {
            var show_speed;
            var $element;
            var u = "u0";

            if (in_post) {
                show_speed = 100;
                $element = in_post;//.children(".pt_foot");
                FJ.ui.btnCancelReply.button("enable");

                FJ.setData(FJ.ui.rbx, FJ.getData(in_post));

                u = "u" + (FJ.status.editing_post ?
                    FJ.getData(in_post).to_user_id :
                    FJ.getData(in_post).user_id);
            } else {
                show_speed = 0;
                $element = FJ.ui.posts_container;
                FJ.ui.btnCancelReply.button(new_thread ? "enable" : "disable");
            }

            FJ.ui.rbx.
                fadeTo(0, 1).
                detach().
                insertAfter($element);
                FJ.ui.selReplyTo.selectmenu("value", u);
                if (in_post) {
                    FJ.ui.rbx.find("textarea").focus();
                }
        },

        hideReplyBox: function() {
            FJ.ui.btnPostReply.button("enable");
            FJ.setData(FJ.ui.rbx);
            FJ.ui.showReplyBox();
            //});
        }
    },

    status: {
        current_thread: 0, previous_thread: 0,
        editing_post: undefined,
        current_user: {
            id: parseInt(($("#sign input").val()).slice(1), 10),
            isAdmin: ($("#sign input").val()).slice(0, 1) === "A",
            unread_counts: []
        }
    },

    config: {
        default_pt_data: {
            user_id: 0,
            to_user_id: 0,
            pt_index: 0,
            id: 0,
            body: ""
        },
        show_unread: false,      // Modified by the 'Threads:' select menu and
                                // read by populateThreadList()
        unread_priority: false, // put folders/threads with unread messages before
                                // others
        maxposts: 50, // max number of posts to load at once
        precache: false, // doesn't do anything yet
        MAX_POST_LENGTH: 10000,
        pt_preview_target: ".pt_body",
        delete_pt_url: "/delete_post/",
        delete_thread_url: "/delete_thread/",
        edit_pt_url: "/edit_post/",
        posts_url: "/posts",
        users_url: "/users",
        threads_url: "/msg_threads",
        new_folder_url: "/folders",
        reply_url: "/posts?reply_to="
    },

    folders: [],
    threads: [],
    pt_cache: {}
}; // if (FJ is undefined)

FJ.setData = function($obj, data) {
    // Set post-related data on $obj, using defaults if no second parameter
    // is defined.
    if (data) {
        $obj.data("pt_data", data);
    } else {
        $obj.data("pt_data", FJ.config.default_pt_data);
    }
};

FJ.getData = function($obj) {
    return $obj.data("pt_data") || FJ.config.default_pt_data;
};

FJ.markup = function(inp) {
    // Converts the Markdown-formatted input into sanitised HTML
    if (typeof inp === "string") {
        // Convert numeric HTML character codes into their actual characters,
        // to prevent stuff like 'p&#111;sition: absolute'
        inp = FJ.ui.showdown.makeHtml(inp || " ");
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
}; // FJ.markup()

FJ.getThread = function(thread_id) {
    // Returns a thread object with the given id, assuming it's in the cache.
    // If not, ideally I want to async fetch it, but I'm unsure how to let
    // the caller know the return value. For now it just returns undefined.
    var result = undefined;
    _(FJ.folders).each(function(folder) {
        _(folder.threads).each(function(thread) {
            if (thread.id === thread_id) {
                result = thread;
                _.breakLoop();
            }
        });
        if (result) _.breakLoop();
    });
    return result;
}; // FJ.getThread()

FJ.counts = function(thread) {
    return " " + [
        thread.unread_count,
        "new&nbsp;of",
        thread.pt_count,
        thread.pt_count === 1 ? "" : ""
    ].join("&nbsp;");
};

FJ.updateThreadItem = function(thread_id) {
    // updates the item on the threads list whose ID === thread_id to reflect
    // changes in, for example, unread count.
    $(".thread_list_item").each(function(i, ele) {
        if ($(ele).data("id") === thread_id) {
            var thread = FJ.getThread(thread_id);
            if (thread.unread_count === 0) {
                $(ele).removeClass("has_unread");
            }
            $(ele).find("span").
                html(FJ.counts(thread));
            return false; // halt thread item iteration
        }
    });
         
};

FJ.getFolderFromId = function(folder_id) {
    // Returns the jQuery object that represents the folder with the given ID
    var result = $("#uncat_threads");
    FJ.ui.folder_list.children.each(function(i) {
        if ($(this).data("id") === folder_id) {
          result = $(this);
          return false;
        }
    });
    return result;
}; // FJ.getFolderFromId()

FJ.scrollToPost = function($post) {
    // Supposedly scrolls to the given post, but doesn't actually work very
    // well due to the moving about of the rbx messing with the size of
    // the scrollable area.
    var offset = 100;
    var pos = FJ.ui.rbx.position().top -
        (FJ.ui.rbx.parent().position().top || 0) -
        offset;
    console.log("Pos:", pos);

    pos = pos < 0 ? 0 : pos;
    FJ.ui.posts_pane.scrollTo(pos, 200);
}; // FJ.scrollToPost()

FJ.resetReplyBox = function() {
    FJ.ui.rbx_thread_title.find("input").val("");
    $("#rbx textarea").val("");
    FJ.ui.rbx.find("textarea").trigger("keyup");
}; // FJ.resetReplyBox()

FJ.getPostFromId = function(id) {
    // Returns the $(.post) object with the given id as its data, if found.
    // Otherwise returns undefined.
    var result;
    $(".post").each(function(i, el) {
        if (FJ.getData($(el)).id === id) {
            result = $(el);
            return false;
        }
    });
    return result;
}; // FJ.getPost()

FJ.getCacheIndexFromId = function(id) {
    var result;
    _(FJ.pt_cache.posts).each(function(el, i) {
        //
        if (el.id == id) {
            result = i;
            _.breakLoop();
        }
    });
    return result
}; // FJ.getCacheIndexFromId()

FJ.addPost = function(p, opts) {
    var $post = $(FJ.ui.pt_fragment).clone();
    var reply_url = "";
    $post.find(".pt_shim").attr("id", p.pt_index + 1);
    $post.find(".pt_head_from").
        attr("href", [FJ.config.users_url, p.from.id].join("/")).
        data("id", p.from.id).
        text(p.from.name);
    if (p.to_user.id === 0) {
        $post.find(".pt_head_to").after(
            document.createTextNode(p.to_user.name));
        $post.find(".pt_head_to").remove();
    } else {
        $post.find(".pt_head_to").
            attr("href", p.to_user.id ?
                [FJ.config.users_url, p.to_user.id].join("/") :
                ""
            ).
            data("id", p.to_user.id).
            text(p.to_user.name);
    }

    $post.find(".pt_head_date").
        text(p.date);
    $post.find(".pt_head_index").
        text(p.pt_index + 1).
        attr("href", "#" + (p.pt_index + 1));
    $post.find(".pt_head_reply_index").
        text(p.to_index + 1).
        attr("href", "#" + (p.to_index + 1));

    $post.find(".pt_body").html(FJ.markup(p.body));
    $post.find(".pt_sig").html(FJ.markup(p.from.sig));

    reply_url = FJ.config.reply_url + p.pt_index;
    $post.find(".pt_foot_reply").attr("href", reply_url);
    $post.find(".pt_foot_quote").
        attr("href", reply_url + "&quote=true");

    $post.find(".pt_foot_delete").
        attr("href", FJ.config.delete_pt_url + p.id);

    // Remove Edit and Delete links if the post is not the current user's,
    // and the current user is not an admin.
    // Note: this check is also done server-side, so even if someone sends a
    // request via hax0ry means, it still won't work - the client-side link
    // removal is more just a UI thing than any kind of real security.
    if (FJ.status.current_user.id !== p.from.id &&
        !FJ.status.current_user.isAdmin) {
        $post.find(".pt_foot_editlinks").remove();
    }

    FJ.setData($post, {
        user_id: p.from.id,
        to_user_id: p.to_user.id,
        pt_index: p.pt_index,
        id: p.id,
        body: p.body
    });

    if (typeof opts === "object" && opts.insert_after) {
        $post.insertAfter(opts.insert_after);
        if (opts.remove_previous) {
            opts.insert_after.remove();
        }
    } else {
        $post.appendTo(FJ.ui.posts_container);
    }

    if (opts && opts.scroll) {
        console.log("Scrolling to: ", $post.position().top);
        FJ.scrollToPost($post);
    }
}; // FJ.addPost()

FJ.deletePost = function(pt_id) {
    if (FJ.getData(FJ.getPostFromId(pt_id)).pt_index === 0) {
        // Callback for thread/post deletion $.get()
        var _deleted_thread = function(response) {
            console.log("Deleting: pt_id: ", pt_id, "and thread id: ",
                FJ.status.current_thread);
            if (response === "WRONG_USER") {
                // This is unlikely to happen normally
                alert("Sorry, you're not authorised to delete this thread.");
                return;
            }

            FJ.ui.rbx.detach();
            FJ.ui.posts_container.empty();
            FJ.ui.thread_title.text("");

            // Find and remove thread from list
            $(".thread_list_item").each(function(i, $item) {
                if ($(this).data("id") === FJ.status.current_thread) {
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
            var url = FJ.config.delete_thread_url + FJ.status.current_thread;
            $.get(url, _deleted_thread);
        }
    } else {
        var _deleted = function(next_pt_id) {
            switch (next_pt_id) {
                case "WRONG_USER": {
                    alert("Sorry, you're not authorised to delete this post.");
                    return;
                };
                default: {
                    console.log("Deleting: pt_id: ", pt_id, ", next id: ",
                        next_pt_id);
                    FJ.getPostFromId(pt_id).fadeTo(200, 0.01, function() {
                        $(this).slideUp(100, function() {
                            $(this).remove();
                            if (next_pt_id !== -1) {
                                // Commenting this out until I can be bothered
                                // making it work properly
                                //FJ.scrollToPost(FJ.getPostFromId(next_pt_id));
                            }
                        });
                    });
                } // case default
            } // switch (next_pt_id)
        }; // _deleted()
        if (window.confirm("Are you sure you want to delete this post?\n\n" +
            "Post number: " +
            (FJ.getData(FJ.getPostFromId(pt_id)).pt_index + 1))) {
            var url = FJ.config.delete_pt_url + pt_id;
            $.get(url, _deleted);
        }
    } // if pt_index === 0
};

FJ.showThread = function(i) {
    // Loads a new thread and renders it in the posts pane.
    FJ.ui.rbx_thread_title.hide();
    var t = FJ.getThread(i);
    if (!t) {
        alert("Tried to load thread of id " + i + " but not in cache.");
        return;
    }

    FJ.posts = [];
    FJ.ui.thread_loading_msg.fadeIn(100);
    FJ.ui.thread_title.show().text(t.title);
    FJ.ui.rbx.detach();
    var o = t.pt_count - t.unread_count;
    if (o >= t.pt_count) o = 0;
    FJ.showPosts(i, o, t.pt_count < 50 ? t.pt_count : 50);
}; // FJ.showThread()

FJ.showPosts = function(thread_id, offset, limit) {
    // Async-requests the specified posts.
    // Eventually this will only fetch posts not already cached, but
    // for now it just fetches what it's told.

    var _fetched = function(pt_data) {
        // Callback that renders the posts sent from the server
        FJ.ui.posts_container.empty(); // will need deleting once we start to
                                      // append posts to the current thread
        var time_start = new Date();

        _(pt_data.posts).each(function(p) {
            FJ.addPost(p, pt_data.count);
        }); // FJ.posts.each()

        var time_end = new Date();
        console.log("Post view render time:", time_end - time_start, "ms");

        FJ.pt_cache = pt_data;
        FJ.status.current_thread = thread_id;

        // Modify the thread in the list to show that the just-loaded messages
        // have now been read.
        var thread = FJ.getThread(thread_id),
            has_read = thread.pt_count - thread.unread_count,
            u = thread.unread_count;
        u -= limit;
        if (u < 0) u = 0;

        thread.unread_count = u;
        FJ.updateThreadItem(thread.id);

        FJ.ui.thread_loading_msg.fadeOut(100);
        FJ.ui.showReplyBox();
        document.title = FJ.getThread(thread_id).title + " - FJ Forum";
    }; // _fetched()

    if (thread_id === FJ.status.current_thread) {
        _fetched(FJ.pt_cache);
    } else {
        var url = FJ.config.posts_url + "?thread=";
        url += [thread_id, "&offset=", offset, "&limit=", limit].join("");
        console.log("URL fetched: ", url);
        $.getJSON(url, _fetched);
    }
}; // FJ.showPosts()

FJ.populateUserLists = function(users) {
    _(users).each(function(user) {
        FJ.ui.selReplyTo.append($("<option/>").
            val("u" + user.id).
            text(user.name)
        );
    });

    FJ.ui.selReplyTo.selectmenu({
        style: "dropdown",
        width: "10em"
    });

}; // FJ.populateUserLists()

FJ.populateThreadsList = function(folders) {
    // Fills the temporary threads list.
    var $folder;

    FJ.threads = [];
    FJ.ui.folder_list.empty();
    FJ.ui.selThreadFolder.empty();

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
            appendTo(FJ.ui.folder_list);

        FJ.ui.selThreadFolder.append(
            $("<option />").
            text(folder.name).
            val(folder.id)
        );

        var $thread_list = $("<ul />").
            addClass("thread_list").
            appendTo(new_folder);

        _(folder.threads).each(function(thread) {
            if (thread.unread_count || FJ.config.show_unread) {
                var new_item = $("<li/>").
                    addClass("thread_list_item bl").
                    addClass(thread.unread_count > 0 ? "has_unread" :
                        "").
                    data("id", thread.id).
                    append($("<a/>").
                        attr("href", [FJ.config.threads_url, thread.id].join("/")).
                        text(thread.title)).
                    append($("<span/>").
                        addClass("item_count").
                        html(FJ.counts(thread))
                    );
                if (thread.id === FJ.status.current_thread) {
                    new_item.addClass("current_thread");
                }
                $thread_list.append(new_item);
            }
            FJ.threads.push(thread);
        }); // folder.threads.each()
    }); // folders.each()

    FJ.ui.selThreadFolder.selectmenu({
        style: "dropdown",
        width: "20em"
    });

    FJ.folders = folders;
    FJ.ui.folders_loading_msg.fadeOut(100);
}; // FJ.populateThreadsList()

FJ.newPostCallback = function(newpost) {
    // Generic handler for both replies to existing threads, and first posts in
    // new threads.
    FJ.ui.rbx_thread_title.hide();
    if (newpost.pt_index == 0) {
        FJ.loadThreadsList();
        FJ.status.current_thread = newpost.thread;
    }
    FJ.resetReplyBox();
    FJ.ui.hideReplyBox();
    // remove_previous can be set to true in all cases since it doesn't get
    // checked unless insert_after is also true.
    FJ.addPost(newpost, { scroll: true,
                            insert_after: FJ.status.editing_post,
                            remove_previous: true });
    FJ.status.editing_post = undefined;
};

FJ.lnkReplyClick = function(event) {
    event.preventDefault();
    FJ.ui.showReplyBox($(this).parents(".post"));
}; // FJ.lnkReplyClick()


FJ.lnkEditClick = function(event) {
    event.preventDefault();
    var post = $(this).parents(".post");
    FJ.status.editing_post = post;
    FJ.ui.rbx.find("textarea").val(FJ.getData(post).body);
    FJ.ui.showReplyBox(post);
    FJ.ui.rbx.find("textarea").trigger("keyup");
    post.hide();
}; // FJ.lnkEditClick()

FJ.lnkDeleteClick = function(event) {
    event.preventDefault();
    console.log(FJ.getData($(this).parents(".post")));
    FJ.deletePost(FJ.getData($(this).parents(".post")).id);
};

FJ.postTextChange = function(is_sig) {
    // Updates post length counter, changing its class to "pt_too_long" if
    // necessary.
    var txt = $(this).val() || " ";
    var length_thingy = $("#pt_length");
    length_thingy.text(txt.length);
    if (txt.length > FJ.config.MAX_POST_LENGTH) {
        length_thingy.addClass("field_with_errors");
    } else {
        length_thingy.removeClass("field_with_errors");
    }

    window.setTimeout(function() {
        var h = FJ.markup(txt);
        FJ.ui.pt_preview.find(FJ.config.pt_preview_target).html(h);
    }, 0);
}; // FJ.postTextChange()

FJ.btnPostReplyClick = function() {
    FJ.ui.rbx.fadeTo(100, 0.5);
    FJ.ui.btnPostReply.button("disable");

    var url = "";
    if (FJ.status.current_thread === 0) {
        // Starting a new thread
        var title = FJ.ui.rbx_thread_title.find("input").val();
        url = FJ.config.threads_url;
        url += [
            "?title=", encodeURIComponent(title),
            "&folder=", FJ.ui.selThreadFolder.val()
        ].join("");
    } else {
        var pt_data = FJ.getData(FJ.ui.rbx);

        if (FJ.status.editing_post) {
            url = FJ.config.edit_pt_url + pt_data.id;
        } else {
            url = FJ.config.reply_url;
            url += [
                FJ.ui.selReplyTo.val(),
                "&thread=", FJ.status.current_thread,
                "&reply_index=", pt_data.pt_index || 0,
                "&pt_index=", FJ.status.current_thread ? 1 : 0
            ].join("");
        }
    }

    var txt = (FJ.ui.rbx.find("textarea").val()).slice(0,
        FJ.config.MAX_POST_LENGTH);

    $.post(url, { textData: txt }, FJ.newPostCallback);
}; // FJ.btnPostReplyClick()

FJ.btnUE_CancelClick = function() {
    $(this).dialog("close");
}; // FJ.btnUE_CancelClick()

FJ.btnUE_OKClick = function() {
    // Update the user's details (TODO)
}; // FJ.btnUE_OKClick()

FJ.lnkUserClick = function(event) {
    event.preventDefault();
    user_id = $(this).data("id");
    FJ.user_editor.open(user_id);
}; // FJ.lnkUserClick()

FJ.btnCancelReplyClick = function() {
    // TODO! Instead of showing the rbx at the end of the posts container
    // if it's not attached to a post, attach it to a "Reply To All" link, then
    // only show it when that link is clicked. This should alleviate some of
    // the scrolling bugs.
    FJ.ui.rbx_thread_title.hide();
    if (FJ.status.previous_thread) {
        FJ.status.current_thread = FJ.status.previous_thread;
        FJ.status.previous_thread = 0;
        FJ.showThread(FJ.status.current_thread);
    } else {
        if (FJ.status.editing_post) {
            FJ.status.editing_post.show();
            FJ.status.editing_post = undefined;
        }
        FJ.resetReplyBox();
        FJ.ui.hideReplyBox();
    }
};

FJ.lnkThreadClick = function(event) {
    event.preventDefault();
    $(".current_thread").removeClass("current_thread");
    $(this).addClass("current_thread");
    FJ.status.current_thread = 0; // force reload of thread when clicked
    FJ.showThread($(this).data("id"));
}; // FJ.lnkThreadClick()

FJ.lnkFolderClick = function(event) {
    var folder = $(this);
    if (folder.hasClass("folder_contracted")) {
        folder.removeClass("folder_contracted");
        folder.next().slideDown(200);
    } else {
        folder.addClass("folder_contracted");
        folder.next().slideUp(200);
    }

}; // FJ.lnkFolderClick()

FJ.btnNewThreadClick = function() {
    FJ.status.previous_thread = FJ.status.current_thread;
    FJ.status.current_thread = 0;

    FJ.ui.thread_title.hide();

    FJ.ui.showReplyBox(undefined, true);
    FJ.ui.posts_container.empty();

    FJ.ui.rbx_thread_title.show();
    FJ.ui.rbx_thread_title.find("input").focus();
}; // FJ.btnNewThreadClick()

FJ.btnNewFolderClick = function() {
    var folder_name = prompt("What would you like to call the new folder?");
    if (folder_name) {
        // Callback:
        var _newFolder = function(folder) {
            FJ.folders.unshift(folder);
            FJ.populateThreadsList({
                last_read: FJ.status.user_last_read,
                folders: FJ.folders
            });
        }; // newFolderCallback()

        var url = [FJ.config.new_folder_url,
            "?name=", encodeURIComponent(folder_name)].join("");
        $.post(url, _newFolder);
    } // if (folder_name)
}; // FJ.btnNewFolderClick()

FJ.selThreadsViewChange = function() {
    switch (this.value) {
        case "UNREAD": {
            FJ.config.show_unread = false;
            break;
        }
        case "ALL": {
            FJ.config.show_unread = true;
            break
        }
        default: {}
    }

    FJ.populateThreadsList(FJ.folders);
};

FJ.loadThreadsList = function() {
    FJ.ui.folders_loading_msg.fadeIn(100);
    $.get(FJ.config.threads_url, FJ.populateThreadsList);
}; // FJ.loadThreadsList()

FJ.logoClick = function() {
    window.location = "/";
};

FJ.layoutSetup = function() {

    // This function doesn't really need to be here any more, as the positioning is mostly handled with CSS now (IE6 be damned).

    // Resized panes so the app fills the window.
    // NOTE: the Chrome extension SmoothScroll has a bug where it won't resize
    // the underlay <div> it creates if the window is sized vertically smaller
    // than it was previously. This has the unfortunate effect of allowing the
    // window to be scrolled even if it doesn't look like it should.

    /*var threads_pane_margins = FJ.ui.threads_pane.outerHeight(true) -
        FJ.ui.threads_pane.height();
    FJ.ui.threads_pane.height(
        $(window).height() - (FJ.ui.page_header.outerHeight(true) +
        FJ.ui.page_footer.outerHeight(true) + threads_pane_margins)
    );
    FJ.ui.posts_pane.height(FJ.ui.threads_pane.outerHeight());*/

    /*var o = FJ.ui.posts_pane.offset();
    FJ.ui.thread_loading_msg.
        show().
        offset(o).
        hide();*/

    // Position 'Threads loading...' message so it appears on top of the New
    // Thread/New Folder buttons.
    /*o = FJ.ui.threads_pane.offset();
    var padding = FJ.ui.threads_pane.innerHeight() -
        FJ.ui.threads_pane.height();

    o.top += padding / 2;
    o.left += padding / 2;

    FJ.ui.folders_loading_msg.
        show().
        offset(o).
        hide();*/
};

FJ.lipsum = function() {
    // I'm really not sure what this is here for. It's only used by the sig
    // editor, and I should probably just have it be the default text for the
    // main forum when the app page is loaded.
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget tempor lacus. Aenean condimentum sem velit. Nulla fringilla, ligula in fringilla dignissim, erat enim malesuada nibh, sit amet convallis lectus mi quis nibh. Suspendisse congue dolor diam. Phasellus faucibus dignissim ligula ut lacinia. Phasellus mattis luctus elit ut porta. Cras.";
}; // FJ.lipsum()

FJ.createPostPreview = function(sig) {
    FJ.config.pt_preview_target = sig ? ".pt_sig" : ".pt_body";
    $("#max_pt_length").text(FJ.config.MAX_POST_LENGTH);
    FJ.ui.pt_preview = FJ.ui.pt_fragment.clone();
    FJ.ui.pt_preview.removeClass("hidden").
        addClass("pt_preview").
        removeAttr("id");
    FJ.ui.pt_preview.find(".pt_head").remove();
    FJ.ui.pt_preview.find(".pt_foot").remove();
    if (sig) {
        FJ.ui.pt_preview.find(".pt_body").
            text(FJ.lipsum()).
            addClass("sig_body_preview");
    } else {
        FJ.ui.pt_preview.find(".pt_sig").remove();
    }
}; // FJ.createPostPreview()


FJ.initUserEditor = function() {
    FJ.user_editor = (function() {
        var _dlg = $("#dlgUserEditor");

        // Check if the element exists, and bail out if it doesn't...
        if (!_dlg) return;

        // ...otherwise, let us continue:
        _dlg.dialog({
            autoOpen: false,
            modal: true,
            //show: "fade",
            title: "Edit User",
            button: {
                "OK": FJ.btnUE_OKClick,
                "Cancel": FJ.btnUE_CancelClick
            }
        });

        FJ.ui.posts_container.
            delegate(".pt_head_fromto a", "click", FJ.lnkUserClick);

        var _UE_name = $("#UE_name"),
            _UE_email = $("#UE_email"),
            _UE_loading = $("#UE_loading");

        return {
            // Public methods
            name: function(new_name) {
                if (new_name) {
                    _UE_name.text(new_name);
                } else {
                    return _UE_name.text();
                }
            }, // name()

            email: function(new_email) {
                if (new_email) {
                    _UE_email.text(new_email);
                } else {
                    return _UE_email.text();
                }
            }, // email()

            open: function(user_id) {
                // Resets fields, makes the 'Loading' message visible,
                // then shows the dialog.
                _UE_loading.show();
                _UE_name.text("");
                _UE_email.text("");

                var url = [FJ.config.users_url, user_id].join("/"),
                    self = this;
                var _userCallback = function(user) {
                    _UE_loading.slideUp(100);
                    self.name(user.name);
                    self.email(user.email);
                }; // _dataFetched()

                _dlg.dialog("open");
                $.get(url, _userCallback);
            },

            close: function() {
                _dlg.dialog("close");
            }
        }
    })();
}; // FJ.initUserEditor()

// Initialise the FJ forum application
FJ.initForum = function(config) {
    // Add whatever's in the supplied 'config' parameter to our existing
    // FJ.config object.
    if (config && typeof(config) == "object") {
        $.extend(FJ.config, config);
    }

    $.ajaxSetup({
        cache: false
    });

    console.log("Starting application...");

    FJ.ui.posts_container.
        delegate(".pt_foot_reply", "click", FJ.lnkReplyClick).
        delegate(".pt_foot_delete", "click", FJ.lnkDeleteClick).
        delegate(".pt_foot_edit", "click", FJ.lnkEditClick);
    FJ.ui.posts_pane.
        delegate("#rbx textarea", "keyup", FJ.postTextChange);
    FJ.ui.folder_list.
        delegate(".thread_list_item", "click", FJ.lnkThreadClick).
        delegate(".folder_name", "click", FJ.lnkFolderClick);

    FJ.ui.btnPostReply.button().click(FJ.btnPostReplyClick);
    FJ.ui.btnCancelReply.button().click(FJ.btnCancelReplyClick);
    FJ.ui.btnNewThread.button().click(FJ.btnNewThreadClick);
    FJ.ui.btnNewFolder.button().click(FJ.btnNewFolderClick);
    FJ.ui.btnReloadThreadsList.button({
        icons: {
            primary: "btn-icon-reload"
        }
    }).click(FJ.loadThreadsList);
    FJ.ui.selThreadsView.
        change(FJ.selThreadsViewChange).
        val("UNREAD").
        selectmenu({
            style: "dropdown",
            width: "14em"
        });

    FJ.initUserEditor();

    FJ.createPostPreview();
    FJ.ui.pt_preview.insertAfter(FJ.ui.rbx.find("#pt_preview_info"));

    FJ.ui.rbx_thread_title.hide();
    FJ.ui.rbx.hide();

    FJ.layoutSetup();
    $(window).resize(FJ.layoutSetup);

    $.get(FJ.config.users_url, FJ.populateUserLists);
    FJ.loadThreadsList();

    // Load post template
    FJ.ui.pt_fragment.detach().
        removeAttr("id").
        removeClass("hidden");
    console.log("Current user: ", FJ.status.current_user.id);
};

FJ.initOther = function() {
    // Initialisation for pages other than the main forum page, e.g. Signup and
    // About
    FJ.ui.buttons.button();
    FJ.config.MAX_POST_LENGTH = 255; // "POST" in this case actually means
                                       // "signature"

    // Create a clone of #pt_fragment, insert it before the original, then
    // remove the original
    FJ.createPostPreview(true); // true will point the preview updater at .pt_sig
    FJ.ui.pt_preview.insertBefore(FJ.ui.pt_fragment);
    FJ.ui.pt_fragment.remove();

    $("#sigeditor").delegate("textarea", "keyup", FJ.postTextChange);
    // trigger an initial keyup as the textarea gets filled automatically by
    // the server
    $("#sigeditor textarea").trigger("keyup");
};

$(document).ready(function() {
    if (document.getElementById("threadspane")) {
        FJ.initForum();
    } else {
        FJ.initOther();
    }
});
