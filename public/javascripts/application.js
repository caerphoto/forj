/*jslint regexp: false, nomen: false*/
/*global $, Attacklab, _, window, alert, prompt */
var FORJ;

if (!FORJ) {
    FORJ = {};
}

FORJ.ui = {
    panes: undefined,
    buttons: $("input:submit"),
    $header: $("#header"),
    $footer: $("#footer"),

    //$threadsPane: $("#threadspane"),
    $folderList: $("#folder_list"),
    $foldersLoadingMsg: $("#folders_loading_msg"),
    btnNewFolder: $("#btnNewFolder"),
    btnNewThread: $("#btnNewThread"),
    btnReloadThreadsList: $("#btnReloadThreadsList"),
    selThreadsView: $("#selThreadsView"),

    $postsPane: $("#postspane"),
    $threadLoading: $("#thread_loading_msg"),
    $threadTitle: $("#thread_title"),
    $postsContainer: $("#posts_container"),

    $postButtonsPrev: $("#post_buttons_prev"),
    $postButtonsNext: $("#post_buttons_next"),
    btnFirstPosts: $("#btnFirstPosts"),
    btnPrevPosts: $("#btnPrevPosts"),
    btnNextPosts: $("#btnNextPosts"),
    btnLastPosts: $("#btnLastPosts"),

    $postFragment: $("#post_template"),
    $replybox: $("#replybox"),
    $replyboxThreadTitle: $("#replybox_thread_title"),
    $replyText: $("#replybox texarea").first(),
    $postPreview: undefined,

    btnPostReply: $("#btnPostReply"),
    btnCancelReply: $("#btnCancelReply"),
    selReplyTo: $("#selReplyTo"),
    selThreadFolder: $("#selThreadFolder"),
    showdown: (function () {
        // Necessary otherwise it causes the JS interpreter to fall over
        // if showdown-min.js is not included on the page.
        if (Attacklab) {
            return new Attacklab.showdown.converter();
        } else {
            return {
                makeHtml: function (text) {
                    return text;
                }
            };
        }
    })(),

    showReplyBox: function (in_post, options) {
        var show_speed,
            $element,
            u = "u0",
            post_data;

        // Set default 'options' in case it's not passed (prevents "Cannot
        // read property 'new_thread' of undefined." errors)
        options = options || {
            new_thread: false,
            quote: false
        };

        if (in_post) {
            show_speed = 100;
            $element = in_post;//.children(".post_foot");
            FORJ.ui.btnCancelReply.button("enable");

            post_data = FORJ.getData(in_post);
            FORJ.setData(FORJ.ui.$replybox, post_data);

            u = (FORJ.status.editing_post ?
                post_data.reply_user :
                post_data.user_id);
        } else {
            show_speed = 0;
            $element = FORJ.ui.$postButtonsNext;
            FORJ.ui.btnCancelReply.button(options.new_thread ? 
                "enable" : "disable");
        }

        FORJ.ui.$replybox.
            detach().
            insertAfter($element).
            show();

        FORJ.ui.selReplyTo.selectmenu("value", u + "");

        if (in_post) {
            FORJ.ui.$replybox.find("textarea").focus();

            if (options.quote) {
                FORJ.ui.$replybox.find("textarea").
                    val(FORJ.makeQuote(post_data.body)).
                    trigger("keyup");
            }
        }

    },

    hideReplyBox: function () {
        FORJ.ui.btnPostReply.button("enable");
        FORJ.setData(FORJ.ui.$replybox);
        FORJ.ui.showReplyBox();
        //});
    }
};

FORJ.status = {
    current_thread: 0,
    previous_thread: 0,
    editing_post: undefined,
    offset_top: 0,
    offset_bottom: 0,
    prev_txt: "",
    current_user: {
        id: parseInt(($("#sign input").val()).slice(1), 10) || 0,
        rank: +($("#sign input").val()).slice(0, 1) || 0,
        unread_counts: []
    }
};

FORJ.config = {
    // This defines the CSS class each emote should have. Sequences are
    // converted to upper case and have the 'nose' - removed first, to avoid
    // the need to define each variation (uppercase, lowercase, with and
    // without nose).
    emotes: {
        ":)": "smile",
        ":(": "sad",
        ":D": "joy",
        ":'(": "cry",
        ":P": "tongue",
        ":$": "shame",
        ":O": "gasp",
        ":|": "unamused",
        ":@": "angry",
        ":/": "unsure",
        ":\\": "unsure",
        ":S": "erm",
        ":C": "grumpy",
        ":&AMP;": "yuck",
        ":'D": "joytear",
        "|(": "fail",
        ":{": "tache",
        "8)": "cool", // '8D' might occur too regularly in normal text

        ":99:": "rolleyes",
        ":FAIL:": "fail",

        ";)": "wink"
    },
    default_post_data: {
        user_id: 0,
        reply_user: 0,
        post_index: 0,
        id: 0,
        body: ""
    },
    show_unread: false,     // Modified by the 'Threads:' select menu and
                            // read by populateThreadList()
    unread_priority: false, // put folders/threads with unread messages before
                            // others
    limit: 50, // max number of posts to load at once
    precache: false, // doesn't do anything yet
    MAX_POST_LENGTH: 10000,
    post_preview_target: ".post_body",

    delete_post_url: "/delete_post/",
    delete_thread_url: "/delete_thread/",
    edit_post_url: "/edit_post/",
    edit_folder_url: "/edit_folder/",
    edit_user_url: "/edit_user/",
    delete_folder_url: "/delete_folder/",
    posts_url: "/posts",
    users_url: "/users",
    threads_url: "/msg_threads",
    new_folder_url: "/folders",
    reply_url: "/posts?reply_user="
};

FORJ.folders = [];
FORJ.threads = [];
FORJ.post_cache = {};

FORJ.setData = function ($obj, data) {
    // Set post-related data on $obj, using defaults if no second parameter
    // is defined.
    if (data) {
        $obj.data("post_data", data);
    } else {
        $obj.data("post_data", FORJ.config.default_post_data);
    }
};

FORJ.getData = function ($obj) {
    return $obj.data("post_data") || FORJ.config.default_post_data;
};

FORJ.makeQuote = function (text) {
    // Returns a the block-quoted version of 'text' in Markdown format
    var quoted;

    if (!text) {
        return "";
    }
    // Put a '>' at the start of each line, and add two line breaks to the end
    quoted = "> " + text.split("\n").join("\n> ") + "\n\n";

    // Remove '>' markers from footnote-style link definitions, otherwise the
    // the definitions appear as plain text
    return quoted.replace(/> (\[.+?\]:)/g, "$1");
};

FORJ.emotify = function (inp) {
    // Emoticon conversion:
    // First, it removes all <code> and "quoted" parts, and stores them.
    // Next, it searches for any remaining emotes and converts them to the
    // appropriate <span> tag.
    // Finally it converts the previously stored parts back into
    // their original forms.

    var codeblock = /(<code(?:[^>]*)>[^<]*)<\/code>/i,
        codeblocks = [],
        quotedblock = /\w+="[^"]+"/,
        quotedblocks = [],
        // This is the regex that defines the emoticons the application will
        // detect. 'Face-style' emotes must not have a whitespace or '>' before
        // them (the '>' is so emotes can appear at the start of paragraphs and
        // other HTML elements).
        emote = /([>\s])(?:[:;|8]'?-?(?:[()DpP$oOsScC\/\\{|@]|&amp;)|(?::(?:99|fail):))/g,
        i = 0,
        emospan;

    emospan = function (emo) {
        // Converts the given emote sequence into its HTML/CSS representation,
        // if possible, otherwise just returns the sequence as text
        var simple_emote = emo.replace("-", "").toUpperCase().slice(1),
            emote_class = FORJ.config.emotes[simple_emote];
        return emote_class ?
            [
                '<span class="emote ', emote_class, '">',
                '<span>', emo, '</span>',
                '</span>'
            ].join("") :
            emo.slice(1);
    };


    // Remove <code> and "quoted" parts, and store them for later
    for (i = 0; codeblock.test(inp); i += 1) {
        inp = inp.replace(codeblock, function () {
                codeblocks[i] = arguments[1];
                return [
                    "FORJ_CODEBLOCK", i,
                    "</code>"
                ].join("");
            });
    }

    for (i = 0; quotedblock.test(inp); i += 1) {
        inp = inp.replace(quotedblock, function () {
                quotedblocks[i] = arguments[0];
                return ["FORJ_QUOTEDBLOCK", i].join("");
            });
    }

    // Replace remaining emote sequences with appropriate <span>s, or just
    // return the emote sequence if the appropriate tag can't be found
    inp = inp.replace(emote, function (m) {
            return arguments[1] + emospan(m);
        });

    // Restore <code> and "quoted" blocks
    i = -1;
    inp = inp.replace(/FORJ_CODEBLOCK\d{1,4}/g, function () {
            i += 1;
            return codeblocks[i];
        });
    i = -1;
    inp = inp.replace(/FORJ_QUOTEDBLOCK\d{1,4}/g, function () {
            i += 1;
            return quotedblocks[i];
        });

    return inp;
};

FORJ.markup = function (inp) {
    // Converts the Markdown-formatted input into sanitised HTML
    if (typeof inp === "string") {
        // Convert numeric HTML character codes into their actual characters,
        // to prevent stuff like 'p&#111;sition: absolute'
        inp = FORJ.ui.showdown.makeHtml(inp || " ");
        inp = inp.replace(/&#(\d+);/g, function (m, n) {
            return String.fromCharCode(n);
        });

        // Remove any references to 'position: absolute' etc. within the
        // 'style' section of an HTML tag
        inp = inp.replace(/(<.+?style\s*?=\s*?")(.*?)(position\s*?:\s*?(absolute|relative|fixed);?)(.*?">)/gi,
            "$1$2$5");

        inp = FORJ.emotify(inp);

        // Convert <script> to HTML character escaped plain text
        return inp.replace(/<(\/)?script/gi, "&lt;$1script");
    } else {
        return "";
    }
}; // FORJ.markup()

FORJ.getThread = function (thread_id) {
    // Returns a thread object with the given id, assuming it's in the cache.
    // If not, ideally I want to async fetch it, but I'm unsure how to let
    // the caller know the return value. For now it just returns undefined.
    var result;

    _(FORJ.folders).each(function (folder) {
        _(folder.threads).each(function (thread) {
            if (thread.id === thread_id) {
                result = thread;
                _.breakLoop();
            }
        });
        if (result) {
            _.breakLoop();
        }
    });
    return result;
}; // FORJ.getThread()

FORJ.counts = function (thread) {
    if (thread.unread_count) {
        return [
            " ",
            thread.unread_count,
            "&nbsp;new&nbsp;of&nbsp;",
            thread.post_count
        ].join("");
    } else {
        return [
            " ",
            thread.post_count,
            "&nbsp;post",
            thread.post_count === 1 ? "" : "s"
        ].join("");
    }
};

FORJ.updateThreadItem = function (thread_id) {
    // updates the item on the threads list whose ID === thread_id to reflect
    // changes in, for example, unread count.
    $(".thread_list_item").each(function (i, ele) {
        if ($(ele).data("id") === thread_id) {
            var thread = FORJ.getThread(thread_id);
            if (thread.unread_count === 0) {
                $(ele).removeClass("has_unread");
            }
            $(ele).find("span").
                html(FORJ.counts(thread));
            if (thread_id === FORJ.status.current_thread) {
                $(ele).addClass("current_thread");
            }
            return false; // halt thread item iteration
        }
    });

};

FORJ.getFolderFromId = function (folder_id) {
    // Returns the folder object with the given ID
    var result;
    _(FORJ.folders).each(function (folder) {
        if (folder.id === folder_id) {
            result = folder;
            _.breakLoop();
        }
    });
    return result;
}; // FORJ.getFolderFromId()

FORJ.scrollToPost = function ($post) {
    // Supposedly scrolls to the given post, but doesn't actually work very
    // well due to the moving about of the replybox messing with the size of
    // the scrollable area.
    var offset = 100,
        pos = FORJ.ui.$replybox.position().top -
        (FORJ.ui.$replybox.parent().position().top || 0) -
        offset;

    pos = pos < 0 ? 0 : pos;
    //$(window).scrollTo(pos, 200);
}; // FORJ.scrollToPost()

FORJ.resetReplyBox = function () {
    FORJ.ui.$replyboxThreadTitle.find("input").val("");
    $("#replybox textarea").val("");
    FORJ.ui.$replybox.find("textarea").trigger("keyup");
}; // FORJ.resetReplyBox()

FORJ.getPostFromId = function (id) {
    // Returns the $(.post) object with the given id as its data, if found.
    // Otherwise returns undefined.
    var result;
    $(".post").each(function (i, el) {
        if (FORJ.getData($(el)).id === id) {
            result = $(el);
            return false;
        }
    });
    return result;
}; // FORJ.getPost()

FORJ.getCacheIndexFromId = function (id) {
    var result;
    _(FORJ.post_cache.posts).each(function (el, i) {
        //
        if (el.id == id) {
            result = i;
            _.breakLoop();
        }
    });
    return result;
}; // FORJ.getCacheIndexFromId()

// Returns a date in one of the following formats:
// dd(st|nd|rd|th) of mmmm [yyyy] at hh:mm
// (Today|Yesterday) at hh:mm [([about] xx (hours|minutes) ago)]
FORJ.formatDate = function (date) {
    var result = [], today, yesterday, age,
        months = [
            "January", "February", "March", "April", "May", "June", "July",
            "August", "September", "October", "November", "December"
        ];

    today = new Date();
    yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.year === today.getFullYear() && date.month === today.getMonth() &&
        date.day === today.getDate()) {

        result.push("Today");
    } else if (date.year === yesterday.getFullYear() && date.month ===
        yesterday.getMonth() && date.day === yesterday.getDate()) {

        result.push("Yesterday");
    } else {
        result.push(date.day);

        switch (date.day) {
        case 1:
        case 21:
        case 31:
            result.push("st");
            break;
        case 2:
        case 22:
            result.push("nd");
            break;
        case 3:
        case 23:
            result.push("rd");
            break;
        default:
            result.push("th");
        } // switch (day)

        result.push(" of " + months[date.month]);

        if (date.year !== today.getFullYear()) {
            result.push(" " + date.year);
        }
    }

    result.push([" at ", date.hour, ":", date.minute].join(""));

    // Calculate post's age in minutes.
    age = (today - (new Date(date.year, date.month, date.day, date.hour,
        date.minute, 0, 0))) / 60000;

    if (age < 0) {
        result.push(" (from the FUTURE!)");
    } else if (age < 60) {
        result.push(" (" + age + " minutes ago)");
    } else if (age < 60 * 24) {
        age = Math.round(age / 60);
        result.push(age === 1 ?
            " (about an hour ago)" :
            " (about " + age + " hours ago)");
    }

    return result.join("");

}; // FORJ.formatDate()

FORJ.createPost = function (p) {
    var $post = $(FORJ.ui.$postFragment).clone(),
        reply_url = "";

    $post.find(".post_shim").
        attr("id", [
            "#", FORJ.status.current_thread,
            "/", (p.post_index + 1)
        ].join(""));

    if (p.from) {
        $post.find(".post_head_from").
            attr("href", [FORJ.config.users_url, p.from.id].join("/")).
            data("id", p.from.id).
            text(p.from.name);
    } else { // No 'from' info, so post was made anonymously
        $post.find(".post_head_from").after(
            document.createTextNode("(anonymous)"));
        $post.find(".post_head_from").remove();
    }

    if (p.to_user) {
        $post.find(".post_head_to").
            attr("href", p.to_user.id ?
                [FORJ.config.users_url, p.to_user.id].join("/") :
                ""
            ).
            data("id", p.to_user.id).
            text(p.to_user.name);
    } else { // No 'to' info, so post is to '(all)'
        $post.find(".post_head_to").after(
            document.createTextNode("(all)"));
        $post.find(".post_head_to").remove();
    }

    $post.find(".post_head_date").
        text(FORJ.formatDate(p.date));
    $post.find(".post_head_index").
        text(p.post_index + 1).
        attr("href", [
            "#", FORJ.status.current_thread,
            "/", (p.post_index + 1)
        ].join(""));
    $post.find(".post_head_reply_index").
        text(p.to_index + 1).
        attr("href", [
            "#", FORJ.status.current_thread,
            "/", (p.to_index + 1)
        ].join(""));

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
    if (FORJ.status.current_user.id !== p.from.id &&
        FORJ.status.current_user.rank < 1) {
        $post.find(".post_foot_editlinks").remove();
    }

    FORJ.setData($post, {
        user_id: p.from ? p.from.id : 0,
        reply_user: p.to_user ? p.to_user.id : 0,
        post_index: p.post_index,
        id: p.id,
        body: p.body
    });

    return $post;
}; // FORJ.createPost()

FORJ.deletePost = function (post_id) {
    var url, _deleted, _deleted_thread;

    if (FORJ.getData(FORJ.getPostFromId(post_id)).post_index === 0) {
        // Callback for thread/post deletion $.get()

        _deleted_thread = function (response) {
            //console.log("Deleting: post_id: ", post_id, "and thread id: ",
                //FORJ.status.current_thread);
            if (response === "WRONG_USER") {
                // This is unlikely to happen normally
                alert("Sorry, you're not authorised to delete this thread.");
                return;
            }

            FORJ.ui.$replybox.detach();
            FORJ.ui.$postsContainer.empty();
            FORJ.ui.$threadTitle.text("");

            // Find and remove thread from list
            $(".thread_list_item").each(function (i, $item) {
                if ($(this).data("id") === FORJ.status.current_thread) {
                    $(this).fadeTo(200, 0.01, function () {
                        $(this).slideUp(100, function () {
                            $(this).remove();
                        });
                    });
                    return false; // halt thread item iteration
                }
            });

        }; // _deleted_thread()

        if (window.prompt(["Deleting the first post of a thread will also ",
            "delete the entire thread.\n\nAre you sure you want to do this?",
            "\n\nType 'delete' into the box below to confirm:"
            ].join("")).toLowerCase() === "delete") {
            url = FORJ.config.delete_thread_url + FORJ.status.current_thread;
            $.get(url, _deleted_thread);
        }
    } else {
        _deleted = function (next_post_id) {
            if (next_post_id === "WRONG_USER") {
                alert("Sorry, you're not authorised to delete this post.");
                return;
            } else {
                //console.log("Deleting: post_id: ", post_id, ", next id: ",
                    //next_post_id);
                FORJ.getPostFromId(post_id).fadeTo(200, 0.01, function () {
                    $(this).slideUp(100, function () {
                        $(this).remove();
                        if (next_post_id !== -1) {
                            // Commenting this out until I can be bothered
                            // making it work properly
                            //FORJ.scrollToPost(
                            //FORJ.getPostFromId(next_post_id));
                        }
                    });
                });
            } // if (WRONG_USER)
        }; // _deleted()
        if (window.confirm("Are you sure you want to delete this post?\n\n" +
            "Post number: " +
            (FORJ.getData(FORJ.getPostFromId(post_id)).post_index + 1))) {
            url = FORJ.config.delete_post_url + post_id;
            $.get(url, _deleted);
        }
    } // if post_index === 0
};

FORJ.getFirstPostOffset = function (thread) {
    var o = thread.post_count - thread.unread_count;
    if (o >= thread.post_count) {
        o = 0;
    }
    return o;
};

FORJ.showThread = function (t) {
    // Loads a new thread and renders it in the posts pane.
    var thread, s;

    FORJ.ui.$replyboxThreadTitle.hide();

    if (typeof t === "string") {
        t = (window.location.hash).split("/")[0].slice(1);
        //console.log("Got thread ID from hash:", t);
    }

    t = +t; // Convert to number else we run into type issues later on, where
            // for example ("16" === 16) fails

    thread = FORJ.getThread(t);

    if (thread) {
        FORJ.ui.$threadTitle.show().text(thread.title);
        FORJ.status.offset_top = FORJ.getFirstPostOffset(thread);
    } else {
        s = (window.location.hash).split("/")[1];
        FORJ.status.offset_top = s - 1;
        thread = { id: t };
    }

    FORJ.posts = [];
    FORJ.ui.$threadLoading.fadeIn(100);
    FORJ.ui.$replybox.detach();
    FORJ.showPosts(thread.id, FORJ.status.offset_top, 0);
}; // FORJ.showThread()

FORJ.showPosts = function (thread_id, offset, insert_direction) {
    // Async-requests the specified posts.
    // Eventually this will only fetch posts not already cached, but
    // for now it just fetches what it's told.
    var _fetched, url, lim, off;
    _fetched = function (data) {
        var post_data = data[0],
            thread = FORJ.getThread(thread_id) || data[1],
            post_a, has_read, u, ot,
            time_start, time_end,
            container;
        // Callback that renders the posts sent from the server

        // insert_direction is -2 if jumping to the first posts of a thread,
        // or 2 if jumping to the end
        if (Math.abs(insert_direction) === 2 || insert_direction === 0) {
            FORJ.ui.$postsContainer.empty();
        }

        //FORJ.status.current_thread = thread.id;
        FORJ.ui.$threadTitle.show().text(thread.title);

        //time_start = new Date();

        // Add posts to the appropriate end of the list.
        container = document.createDocumentFragment();
        _(post_data.posts).each(function (p) {
            container.appendChild(FORJ.createPost(p)[0]);
        });

        if (insert_direction < 0) {
            FORJ.ui.$postsContainer.prepend(container);
        } else {
            FORJ.ui.$postsContainer.append(container);
        }

        //time_end = new Date();
        //console.log("Post view render time:", time_end - time_start, "ms");

        // Record existing post data, then combine the new data with it
        // according to which end the posts were added.
        switch (insert_direction) {
        case -1:
            post_a = FORJ.post_cache.posts;
            FORJ.post_cache = post_data;
            FORJ.post_cache.posts = FORJ.post_cache.posts.concat(post_a);
            break;
        case 1:
            post_a = FORJ.post_cache.posts;
            FORJ.post_cache = post_data;
            FORJ.post_cache.posts = post_a.concat(post_data.posts);
            break;
        default:
            // insert_direction is either -2, 2, 0 or undefined
            FORJ.post_cache = post_data;
        }

        // Modify the thread in the list to show that the just-loaded messages
        // have now been read.
        has_read = thread.post_count - thread.unread_count;
        u = thread.unread_count;
        u -= FORJ.config.limit;
        if (u < 0) {
            u = 0;
        }

        thread.unread_count = u;
        FORJ.updateThreadItem(thread.id);

        // Modify top and bottom offsets depending on how the posts were added
        switch (insert_direction) {
        case -2:
            FORJ.status.offset_top = 0 - FORJ.config.limit;
            FORJ.status.offset_bottom = FORJ.config.limit;
            break;
        case -1:
            FORJ.status.offset_top = offset - FORJ.config.limit;
            break;
        case 0:
            FORJ.status.offset_top = offset - FORJ.config.limit;
            FORJ.status.offset_bottom = offset + FORJ.config.limit;
            break;
        case 1:
            FORJ.status.offset_bottom = offset + FORJ.config.limit;
            break;
        case 2:
            FORJ.status.offset_top = thread.post_count - FORJ.config.limit * 2;
            FORJ.status.offset_bottom = thread.post_count;
            break;
        }

        // Hide or show post navigation buttons appropriately
        if (FORJ.status.offset_top > 0 - FORJ.config.limit) {
            FORJ.ui.$postButtonsPrev.show();
        } else {
            FORJ.ui.$postButtonsPrev.hide();
        }
        if (thread.post_count > FORJ.status.offset_bottom) {
            FORJ.ui.$postButtonsNext.show();
        } else {
            FORJ.ui.$postButtonsNext.hide();
        }

        // UI finishing-up:
        FORJ.ui.$threadLoading.fadeOut(100);
        FORJ.ui.showReplyBox();
        document.title = thread.title + " - FORJ Forum";
        ot = FORJ.status.offset_top + FORJ.config.limit;
        if (ot < 0) {
            ot = 0;
        }

        window.location.hash = [
            "#", FORJ.status.current_thread,
            "/", ot + 1
        ].join("");
        // Mark the current thread appropriately in the list if the
        // folders/threads list list has been loaded
        if (FORJ.folders) {
            FORJ.updateThreadItem(thread_id);
        }
        //if (FORJ.folders) FORJ.populateThreadsList(FORJ.folders);

    }; // _fetched()

    // insert_direction will be 0 or undefined when re-showing a thread after
    // clicking Cancel after starting to create a new thread
    if (thread_id === FORJ.status.current_thread && !insert_direction) {
        _fetched(FORJ.post_cache);
    } else {
        FORJ.status.current_thread = thread_id;
        //console.log("Current thread:", FORJ.status.current_thread);
        url = FORJ.config.posts_url + "?thread=";
        lim = offset < 0 ? FORJ.config.limit + offset : FORJ.config.limit;
        off = offset < 0 ? 0 : offset;

        url += [
            thread_id,
            "&offset=", off,
            "&limit=", lim
        ].join("");
        $.getJSON(url, _fetched);
    }
}; // FORJ.showPosts()

FORJ.populateUserLists = function (users) {
    _(users).each(function (user) {
        FORJ.ui.selReplyTo.append($("<option/>").
            val(user.id).
            text(user.name)
        );
    });

    FORJ.ui.selReplyTo.selectmenu({
        style: "dropdown",
        width: "10em"
    });

}; // FORJ.populateUserLists()

FORJ.populateThreadsList = function (folders) {
    // Populates the folders/threads list based on the contents of the
    // 'folders' parameter, which is expected to be an array of objects like
    // this:
    // { 
    //     name: "folder's name",
    //     id: 0,
    //     thread_count: 0,
    //     threads: []
    // }
    // the structure has a separate thread_count property because the threads[]
    // array will contain 10 items at most, whereas thread_count represents the
    // total number of threads in the folder.
    //
    // Each folder's threads[] array contains objects like this:
    // {
    //     title: "thread's title",
    //     id: 0,
    //     unread_count: 0,
    //     post_count: 0
    // }

    //console.log("Populating threadss list. Current thread:",
        //FORJ.status.current_thread);
    var $folder, total_unread = 0;

    FORJ.threads = [];
    FORJ.ui.$folderList.empty();
    FORJ.ui.selThreadFolder.selectmenu("destroy");
    FORJ.ui.selThreadFolder.empty();

    // Do a quick scan through to see if the total unread count is 0. If so,
    // show all threads.
    total_unread = 0;
    _(folders).each(function (folder) {
        _(folder.threads).each(function (thread) {
            total_unread += thread.unread_count;
        });
    });
    if (total_unread === 0) {
        FORJ.config.show_unread = true;
    }

    _(folders).each(function (folder) {
        var new_folder = $("<li />").
            data("id", folder.id).
            addClass("$folderList_item").
            append($("<a />").
                addClass("folder_name").
                text(folder.name).
                append($("<span />").
                    addClass("item_count").
                    text(" " + folder.thread_count +
                        (folder.thread_count === 1 ? " thread" : " threads")
                    )
                ).
                append(
                    (function () {
                        return FORJ.status.current_user.rank > 1 &&
                            folder.id > 0 ?
                            $("<a />").addClass("folder_settings") :
                            undefined;
                    })()
                )
            ).
            appendTo(FORJ.ui.$folderList),
            $thread_list;

        FORJ.ui.selThreadFolder.append(
            $("<option />").
            text(folder.name).
            val(folder.id)
        );

        $thread_list = $("<ul />").
            addClass("thread_list").
            appendTo(new_folder);

        _(folder.threads).each(function (thread) {
            if (thread.unread_count || FORJ.config.show_unread ||
                thread.id === FORJ.status.current_thread) {
                var new_item = $("<li/>").
                    addClass("thread_list_item bl").
                    addClass(thread.unread_count > 0 ? "has_unread" :
                        "").
                    data("id", thread.id).
                    append($("<a/>").
                    attr("href", [
                        "#", thread.id,
                        "/", (FORJ.getFirstPostOffset(thread) + 1)
                    ].join("")).
                    text(thread.title)).
                    append($("<span/>").
                        addClass("item_count").
                        html(FORJ.counts(thread))
                    );
                if (thread.id === FORJ.status.current_thread) {
                    new_item.addClass("current_thread");
                }
                $thread_list.append(new_item);
            } // if (has unread, showing unread, or is current thread)
            FORJ.threads.push(thread);
        }); // folder.threads.each()
    }); // folders.each()

    FORJ.ui.selThreadFolder.selectmenu({
        style: "dropdown",
        width: "20em"
    });

    if (FORJ.config.show_unread) {
        FORJ.ui.selThreadsView.selectmenu("value", "ALL");
    }

    FORJ.folders = folders;
    FORJ.ui.$foldersLoadingMsg.fadeOut(100);
}; // FORJ.populateThreadsList()

FORJ.newPostCallback = function (newpost) {
    // Generic handler for both replies to existing threads, and first posts in
    // new threads.
    FORJ.ui.$replyboxThreadTitle.hide();
    if (newpost.post_index === 0) {
        FORJ.loadThreadsList();
        FORJ.status.current_thread = newpost.thread;
    }
    FORJ.resetReplyBox();
    FORJ.ui.hideReplyBox();
    // remove_previous can be set to true in all cases since it doesn't get
    // checked unless insert_after is also true.
    if (FORJ.status.editing_post) {
        FORJ.createPost(newpost).insertAfter(FORJ.status.editing_post);
        FORJ.status.editing_post.remove();
        FORJ.status.editing_post = undefined;

    } else {
        FORJ.createPost(newpost).appendTo(FORJ.ui.$postsContainer);
    }
};

FORJ.lnkReplyClick = function (event) {
    event.preventDefault();
    FORJ.ui.showReplyBox($(this).parents(".post"));
}; // FORJ.lnkReplyClick()

FORJ.lnkReplyQuoteClick = function (event) {
    event.preventDefault();
    FORJ.ui.showReplyBox($(this).parents(".post"), { quote: true });
}; // FORJ.lnkReplyQuoteClick()

FORJ.lnkEditClick = function (event) {
    event.preventDefault();
    var post = $(this).parents(".post");
    FORJ.status.editing_post = post;
    FORJ.ui.$replybox.find("textarea").val(FORJ.getData(post).body);
    FORJ.ui.showReplyBox(post);
    FORJ.ui.$replybox.find("textarea").trigger("keyup");
    post.hide();
}; // FORJ.lnkEditClick()

FORJ.lnkDeleteClick = function (event) {
    event.preventDefault();
    //console.log(FORJ.getData($(this).parents(".post")));
    FORJ.deletePost(FORJ.getData($(this).parents(".post")).id);
};

FORJ.btnFirstPostsClick = function () {
    FORJ.ui.$threadLoading.fadeIn(100);
    FORJ.showPosts(FORJ.status.current_thread, 0, -2);
};

FORJ.btnPrevPostsClick = function () {
    FORJ.ui.$threadLoading.fadeIn(100);
    FORJ.showPosts(FORJ.status.current_thread, 
        FORJ.status.offset_top, -1);
};

FORJ.btnNextPostsClick = function () {
    FORJ.ui.$threadLoading.fadeIn(100);
    FORJ.showPosts(FORJ.status.current_thread,
        FORJ.status.offset_bottom, 1);
};

FORJ.btnLastPostsClick = function () {
    FORJ.ui.$threadLoading.fadeIn(100);
    var t = FORJ.getThread(FORJ.status.current_thread);
    FORJ.showPosts(FORJ.status.current_thread,
        t.post_count - FORJ.config.limit, 2);
};

FORJ.postTextChange = function (is_sig) {
    // Updates post length counter, changing its class to "post_too_long" if
    // necessary.
    var txt = $(this).val() || " ", length_thingy;
    if (txt === FORJ.status.prev_txt) {
        return;
    } else {
        FORJ.status.prev_txt = txt;
    }

    length_thingy = $("#post_length");
    length_thingy.text(txt.length);
    if (txt.length > FORJ.config.MAX_POST_LENGTH) {
        length_thingy.addClass("field_with_errors");
    } else {
        length_thingy.removeClass("field_with_errors");
    }

    window.setTimeout(function () {
        var h = FORJ.markup(txt);
        FORJ.ui.$postPreview.find(FORJ.config.post_preview_target).html(h);
    }, 0);
}; // FORJ.postTextChange()

FORJ.btnPostReplyClick = function () {
    var url = "", title, post_data, d, txt;

    FORJ.ui.btnPostReply.button("disable");

    if (FORJ.status.current_thread === 0) {
        // Starting a new thread
        title = FORJ.ui.$replyboxThreadTitle.find("input").val();
        url = FORJ.config.threads_url;
        url += [
            "?title=", encodeURIComponent(title),
            "&folder=", FORJ.ui.selThreadFolder.val()
        ].join("");
    } else {
        // Replying to an existing thread
        post_data = FORJ.getData(FORJ.ui.$replybox);

        if (FORJ.status.editing_post) {
            url = FORJ.config.edit_post_url + post_data.id;
            d = FORJ.ui.selReplyTo.val();//selectmenu("value")
            //console.log("d =", d);
            url += [
                "?",
                "reply_user=", d
            ].join("");
        } else {
            url = FORJ.config.reply_url;
            url += [
                FORJ.ui.selReplyTo.val(),
                "&thread=", FORJ.status.current_thread,
                "&reply_index=", post_data.post_index || 0
            ].join("");
        }
    }

    txt = (FORJ.ui.$replybox.find("textarea").val()).slice(0,
        FORJ.config.MAX_POST_LENGTH);

    $.post(url, { textData: txt }, FORJ.newPostCallback);
}; // FORJ.btnPostReplyClick()

FORJ.lnkUserClick = function (event) {
    var user_id;

    event.preventDefault();
    user_id = $(this).data("id");
    FORJ.user_editor.open(user_id);
}; // FORJ.lnkUserClick()

FORJ.btnCancelReplyClick = function () {
    // TODO! Instead of showing the replybox at the end of the posts container
    // if it's not attached to a post, attach it to a "Reply To All" link, then
    // only show it when that link is clicked. This should alleviate some of
    // the scrolling bugs.
    FORJ.ui.$replyboxThreadTitle.hide();
    if (FORJ.status.previous_thread) {
        FORJ.status.current_thread = FORJ.status.previous_thread;
        FORJ.status.previous_thread = 0;
        FORJ.showThread(FORJ.status.current_thread);
    } else {
        if (FORJ.status.editing_post) {
            FORJ.status.editing_post.show();
            FORJ.status.editing_post = undefined;
        }
        FORJ.resetReplyBox();
        FORJ.ui.hideReplyBox();
    }
};

FORJ.lnkThreadClick = function (event) {
    event.preventDefault();
    $(".current_thread").removeClass("current_thread");
    $(this).addClass("current_thread");
    FORJ.status.current_thread = 0; // force reload of thread when clicked
    FORJ.showThread($(this).data("id"));
}; // FORJ.lnkThreadClick()

FORJ.lnkFolderClick = function () {
    // simplified version based on a suggestion by Pete Boughton
    if (!FORJ.status.editing_folder) {
        $(this).
            toggleClass("folder_contracted").
            next().slideToggle(200);
    }
    FORJ.status.editing_folder = false;
}; // FORJ.lnkFolderClick()

FORJ.lnkFolderSettingsClick = function (event) {
    var id = $(this).parents("li").data("id");

    FORJ.status.editing_folder = true;
    //console.log("Opening folder editor for ID:", id);
    FORJ.dlgFolderEditor.open(id);
}; // FORJ.lnkFolderSettingsClick()

FORJ.btnNewThreadClick = function () {
    FORJ.status.previous_thread = FORJ.status.current_thread;
    FORJ.status.current_thread = 0;

    FORJ.ui.$threadTitle.hide();

    FORJ.ui.showReplyBox(undefined, { new_thread: true });
    FORJ.ui.$postsContainer.empty();

    FORJ.ui.$replyboxThreadTitle.show();
    FORJ.ui.$replyboxThreadTitle.find("input").focus();
}; // FORJ.btnNewThreadClick()

FORJ.btnNewFolderClick = function () {
    var folder_name = prompt("What would you like to call the new folder?"),
        _newFolder, url;

    if (folder_name) {
        // Callback:
        _newFolder = function (folders) {
            //FORJ.folders.unshift(folder);
            FORJ.populateThreadsList(folders);
        }; // newFolderCallback()

        url = [FORJ.config.new_folder_url,
            "?name=", encodeURIComponent(folder_name)].join("");
        $.post(url, _newFolder);
    } // if (folder_name)
}; // FORJ.btnNewFolderClick()

FORJ.selThreadsViewChange = function () {
    switch (this.value) {
    case "UNREAD":
        FORJ.config.show_unread = false;
        break;
    case "ALL":
        FORJ.config.show_unread = true;
        break;
    }

    FORJ.populateThreadsList(FORJ.folders);
};

FORJ.loadThreadsList = function () {
    FORJ.ui.$foldersLoadingMsg.fadeIn(100);
    $.get(FORJ.config.threads_url, FORJ.populateThreadsList);
}; // FORJ.loadThreadsList()

FORJ.logoClick = function () {
    window.location = "/";
};

FORJ.lipsum = function () {
    // I'm really not sure what this is here for. It's only used by the sig
    // editor, and I should probably just have it be the default text for the
    // main forum when the app page is loaded.
    return "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla eget tempor lacus. Aenean condimentum sem velit. Nulla fringilla, ligula in fringilla dignissim, erat enim malesuada nibh, sit amet convallis lectus mi quis nibh. Suspendisse congue dolor diam. Phasellus faucibus dignissim ligula ut lacinia. Phasellus mattis luctus elit ut porta. Cras.";
}; // FORJ.lipsum()

FORJ.createPostPreview = function (sig) {
    FORJ.config.post_preview_target = sig ? ".post_sig" : ".post_body";
    $("#max_post_length").text(FORJ.config.MAX_POST_LENGTH);
    FORJ.ui.$postPreview = FORJ.ui.$postFragment.clone();
    FORJ.ui.$postPreview.removeClass("hidden").
        addClass("post_preview").
        removeAttr("id");
    FORJ.ui.$postPreview.find(".post_head").remove();
    FORJ.ui.$postPreview.find(".post_foot").remove();
    if (sig) {
        FORJ.ui.$postPreview.find(".post_body").
            text(FORJ.lipsum()).
            addClass("sig_body_preview");
    } else {
        FORJ.ui.$postPreview.find(".post_sig").remove();
    }
}; // FORJ.createPostPreview()


FORJ.initUserEditor = function () {
    FORJ.user_editor = (function () {
        var dlg = $("#dlgUserEditor"),
            user, UE_name, UE_email, UE_rank, UE_loading, UE_last_login, ranks;

        // Check if the element exists, and bail out if it doesn't...
        if (!dlg) {
            return;
        }

        // ...otherwise, let us continue:
        user = {
            id: 0,
            name: "",
            email: "",
            rank: -1,
            last_login: ""
        };

        UE_name = $("#UE_name");
        UE_email = $("#UE_email");
        UE_rank = $("#UE_rank");
        UE_loading = $("#UE_loading");
        UE_last_login = $("#UE_last_login");
        ranks = [
            "Anonymous",
            "Normal user",
            "Moderator",
            "Admin"
        ];


        dlg.removeClass("unfouc").dialog({
            autoOpen: false,
            modal: true,
            width: "25em",
            title: "User Details"
        });

        dlg.dialog("option", "buttons", [
            {
                enabled: FORJ.status.current_user.rank > 1,
                text: "OK",
                click: function () {
                    //console.log("UE OK clicked");
                    var newrank = -1, _editUserCallback, url;

                    dlg.find("input[name='user_type']").each(function () {
                        if ($(this).attr("checked")) {
                            newrank = +($(this).val());
                            return false;
                        }
                    });

                    //console.log("newrank =", newrank);

                    if (newrank === -1) {
                        //console.log("Failed to get new rank.");
                        $(this).dialog("close");
                    } else {
                        _editUserCallback = function (res) {
                            //console.log("Update user callback response:",
                            //res);
                            dlg.dialog("close");
                        };

                        url = FORJ.config.edit_user_url + user.id;

                        url += [
                            "?",
                            "newrank=", newrank
                        ].join("");

                        //console.log("user.id =", user.id);
                        //console.log("current_user.rank =",
                            //FORJ.status.current_user.rank);

                        if (FORJ.status.current_user.rank > 1) {
                            //console.log("POST to:", url);
                            $.post(url, _editUserCallback);
                        }
                    }
                } // "OK" button click()
            }, // "OK" button
            {
                text: "Cancel",
                click: function () {
                    $(this).dialog("close");
                }
            }
        ]);

        FORJ.ui.$postsContainer.
            delegate(".post_head_fromto a", "click", FORJ.lnkUserClick);

        return {
            open: function (user_id) {
                // Resets fields, makes the 'Loading' message visible,
                // then shows the dialog.
                UE_loading.show().fadeTo(0, 1);
                UE_name.text("");
                UE_email.text("");
                UE_rank.text("");
                UE_last_login.text("");
                dlg.find("input[type=radio]").removeAttr("checked");

                var url = [FORJ.config.users_url, user_id].join("/"),
                    _userFetched = function (user_info) {
                        UE_loading.fadeTo(200, 0.01, function () {
                            UE_loading.slideUp(50);
                        });
                        user = user_info;
                        UE_name.text(user.name);
                        UE_email.text(user.email);
                        //console.log("Rank of user:", user.rank);
                        UE_rank.text(ranks[user.rank] || "Forum owner");

                        dlg.find("input[name='user_type']").each(function () {
                            if ($(this).val() == user.rank) {
                                $(this).attr("checked", "checked");
                                return false;
                            }
                        });

                        UE_last_login.text(user.last_login);
                    }; // _userFetched()

                dlg.dialog("open");
                $.get(url, _userFetched);
            }
        };
    })();
}; // FORJ.initUserEditor()

FORJ.initFolderEditor = function () {
    FORJ.dlgFolderEditor = (function () {
        var _dlg = $("#dlgFolderEditor"),
            folder, tbxName;

        if (!_dlg) {
            return;
        }

        tbxName = $("#tbxFE_Name");

        _dlg.removeClass("unfouc").dialog({
            autoOpen: false,
            modal: true,
            width: "30em",
            buttons: {
                "Delete": function () {
                    if (window.confirm([
                        "Are you sure you want to delete this folder:",
                        folder.name,
                        "Any threads it contains will be moved to the " +
                        "'Uncategorised' folder."
                    ].join("\n\n")
                    )) {
                        var url = FORJ.config.delete_folder_url + folder.id,
                            self = this;
                        $.post(url, function (newfolders) {
                            FORJ.populateThreadsList(newfolders);
                            $(self).dialog("close");
                        });
                    }
                },
                "OK": function () {
                    var url = FORJ.config.edit_folder_url + folder.id + "?",
                        self = this,
                        clearance = -1;

                    $(self).find("input[name='clearance']").each(function () {
                        if ($(this).attr("checked")) {
                            clearance = +($(this).val());
                            return false;
                        }
                    });

                    //console.log("clearance =", clearance);
                    if (clearance === -1) {
                        //console.log("Failed to get new clearance.");
                        $(self).dialog("close");
                    } else {
                        url += [
                            "clearance=", clearance,
                            "&newname=", encodeURIComponent(tbxName.val())
                        ].join("");

                        $.post(url, function (newdata) {
                            _(FORJ.folders).each(function (f) {
                                if (f.id === folder.id) {
                                    f.name = newdata.name;
                                    f.clearance = newdata.clearance;
                                    FORJ.populateThreadsList(FORJ.folders);
                                    _.breakLoop();
                                }
                            });

                            $(self).dialog("close");
                        });
                    }
                },
                "Cancel": function () {
                    $(this).dialog("close");
                }
            }
        });

        return {
            // Public methods
            open: function (folder_id) {
                folder = FORJ.getFolderFromId(folder_id);

                //console.log("Folder clearance:", folder.clearance);

                tbxName.val(folder.name);
                _dlg.find("input[type=radio]").removeAttr("checked");

                _dlg.find("input[name='clearance']").each(function () {
                    //console.log("Radiobutton.val:", $(this).val());
                    if ($(this).val() == folder.clearance) {
                        $(this).attr("checked", "checked");
                        return false;
                    }
                });

                _dlg.dialog("option", "title", "Edit Folder: " + folder.name);
                _dlg.dialog("open");
                tbxName.focus();
            }
        };
    })();
}; // FORJ.initFolderEditor()

// Initialise the FORJ forum application
FORJ.initForum = function (config) {
    // Add whatever's in the supplied 'config' parameter to our existing
    // FORJ.config object.
    if (config && typeof(config) == "object") {
        $.extend(FORJ.config, config);
    }

    $.ajaxSetup({ cache: false });

    //console.log("Starting application...");

    FORJ.ui.$postsContainer.
        delegate(".post_foot_reply", "click", FORJ.lnkReplyClick).
        delegate(".post_foot_replyquote", "click", FORJ.lnkReplyQuoteClick).
        delegate(".post_foot_delete", "click", FORJ.lnkDeleteClick).
        delegate(".post_foot_edit", "click", FORJ.lnkEditClick);
    FORJ.ui.$postsPane.
        delegate("#replybox textarea", "keyup", FORJ.postTextChange);
    FORJ.ui.$folderList.
        delegate(".thread_list_item", "click", FORJ.lnkThreadClick).
        delegate(".folder_name", "click", FORJ.lnkFolderClick).
        delegate(".folder_settings", "click", FORJ.lnkFolderSettingsClick);

    FORJ.ui.btnPostReply.button().click(FORJ.btnPostReplyClick);
    FORJ.ui.btnCancelReply.button().click(FORJ.btnCancelReplyClick);
    FORJ.ui.btnNewThread.button().click(FORJ.btnNewThreadClick);
    FORJ.ui.btnNewFolder.button().click(FORJ.btnNewFolderClick);
    FORJ.ui.btnReloadThreadsList.
        button({ icons: { primary: "btn-icon-reload" } }).
        click(FORJ.loadThreadsList);
    FORJ.ui.selThreadsView.
        change(FORJ.selThreadsViewChange).
        val("UNREAD").
        selectmenu({
            style: "dropdown",
            width: "14em"
        });

    FORJ.ui.btnFirstPosts.
        button({ icons: { primary: "btn-icon-firstposts" } }).
        click(FORJ.btnFirstPostsClick);
    FORJ.ui.btnPrevPosts.
        button({ icons: { primary: "btn-icon-prevposts" } }).
        click(FORJ.btnPrevPostsClick);
    FORJ.ui.btnNextPosts.
        button({ icons: { primary: "btn-icon-nextposts" } }).
        click(FORJ.btnNextPostsClick);
    FORJ.ui.btnLastPosts.
        button({ icons: { primary: "btn-icon-lastposts" } }).
        click(FORJ.btnLastPostsClick);

    $(".posts_nav").hide();

    FORJ.initUserEditor();
    FORJ.initFolderEditor();

    $(".post").removeClass("unfouc");
    FORJ.createPostPreview();
    FORJ.ui.$postPreview.insertAfter(FORJ.ui.$replybox.
        find("#post_preview_info"));

    FORJ.ui.$replyboxThreadTitle.hide();
    FORJ.ui.$replybox.removeClass("unfouc");
    FORJ.ui.$replybox.hide();

    $.get(FORJ.config.users_url, FORJ.populateUserLists);
    FORJ.loadThreadsList();

    FORJ.ui.$postFragment.detach().
        removeAttr("id");

    FORJ.ui.$postButtonsPrev.removeClass("unfouc");
    FORJ.ui.$postButtonsNext.removeClass("unfouc");

    //console.log("Current user: ", FORJ.status.current_user.id);
    //console.log("Rank:", FORJ.status.current_user.rank);

    if (window.location.hash) {
        FORJ.showThread(window.location.hash);
    }
};

FORJ.initOther = function () {
    // Initialisation for pages other than the main forum page, e.g. Signup and
    // About
    FORJ.ui.buttons.button();
    FORJ.config.MAX_POST_LENGTH = 255; // "POST" in this case actually means
                                       // "signature"

    // Create a clone of #$postFragment, insert it before the original, then
    // remove the original
    $(".post").removeClass("unfouc");

    // true will point the preview updater at .post_sig
    FORJ.createPostPreview(true); 
    FORJ.ui.$postPreview.insertBefore(FORJ.ui.$postFragment);
    FORJ.ui.$postFragment.remove();

    $("#sigeditor").delegate("textarea", "keyup", FORJ.postTextChange);
    // trigger an initial keyup as the textarea gets filled automatically by
    // the server
    $("#sigeditor textarea").trigger("keyup");
};

$(document).ready(function () {
    if (document.getElementById("threadspane")) {
        FORJ.initForum();
    } else {
        FORJ.initOther();
    }
});
