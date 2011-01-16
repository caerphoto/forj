class PostsController < ApplicationController
    def create_lots_of_test_posts thread_id
        thread = MsgThread.find(thread_id)
        first_index = thread.posts.last.post_index
        (1...50).each do |i|
            post = thread.posts.build(
                :content => lorem(5 + rand(200)),
                :post_index => first_index + i,
                :user_id => rand(User.all.length) + 1,
                :reply_user_id => rand(User.all.length) + 1,
                :reply_index => rand(first_index + i))
            post.save
        end
    end

    def index
        # Assums the presence of a 'thread' parameter in the query string,
        # otherwise it won't load anything.

        # It's up to the JS to set appropriate :limit and :offset
        post_array = []
        thread = MsgThread.find(params[:thread])
        thread.posts.all(
            :order => "id",
            :limit => params[:limit],
            :offset => params[:offset],
            :include => [:user, :reply_user]
        ).each do |post|
            post_array.push post.to_h #get_post_info(post)
        end

        post_count = params[:offset].to_i + params[:limit].to_i

        post_count = thread.posts.length if post_count > thread.posts.length

        if user_signed_in?
            current_user.update_last_read thread.id, post_count
        end

        result = [
            {
                :posts => post_array,
                :count => thread.posts.length
            },
            thread.to_h
        ]

        render :json => result.to_json
    end

    def create
        # Testing/debug options
        if params[:textData] == "DOTEST"
            create_lots_of_test_posts params[:thread].to_i
            render :text => "CREATED TEST POSTS"
        elsif params[:textData] == "RESET_LAST_READ"
            reset_last_read
            render :text => "RESET OK"
        else
            thread = MsgThread.find(params[:thread])

            create_post thread,
                :content => params[:textData],
                :post_index => thread.posts.last.post_index + 1,
                :reply_index => params[:reply_index].to_i,
                :reply_user_id => params[:reply_user].to_i
            thread.save

            render :json => thread.posts.last.to_h.to_json
        end
    end

    def show
        post = Post.find(params[:id])
        render :json => post.detail_hash.to_json
    end

    def destroy
        post = Post.find(params[:id])

        if post.user.id != current_user.id and current_user.rank < 1
            return render :text => "WRONG_USER"
        end

        if post.post_index == 0
            # Destroy thread if first post is deleted
            thread = MsgThread.find(post.msg_thread_id)
            thread.destroy # callback in thread model deletes all thread's posts
            render :json => nil
        else
            # Find post_index of next post, then delete post
            thread_posts = Post.find(:all,
                                     :conditions => ["msg_thread_id = ?",
                                                     post.msg_thread_id],
                                     :order => "created_at")
            result = -1
            thread_posts.each_index do |post_index|
                if thread_posts[post_index].id == post.id
                    if post_index < (thread_posts.length - 1)
                        result = thread_posts[post_index + 1].id
                    else
                        result = thread_posts[post_index - 1].id
                    end
                end
            end

            post.destroy
            render :json => result
        end
    end

    def edit
        post = Post.find(params[:id])

        if post.user.id != current_user.id and current_user.rank < 1
            return render :text => "WRONG_USER"
        end

        post.content = params[:textData]
        post.reply_user_id = params[:reply_user].to_i
        post.save

        render :json => post.detail_hash.to_json
    end
end
