def get_post_user_info(user)
    unless user.nil?
        {
            :name => user.name,
            :sig => user.sig,
            :id => user.id
        }
    else
        {
            :name => "(all)",
            :sig => "no sig",
            :id => 0
        }
    end
end

def get_post_info(post)
    { :from => get_post_user_info(post.user),
      :to_index => post.reply_index,
      :to_user => get_post_user_info(post.reply_user),
      :date => post.created_at,
      :post_index => post.post_index,
      :body => post.content,
      :thread => post.msg_thread.id,
      :id => post.id
    }
end

def generate_random_content
    words =<<EOS
Lorem ipsum dolor sit amet, consectetuer adipiscing elit. Integer in
mi a mauris ornare sagittis. Suspendisse potenti. Suspendisse dapibus
dignissim dolor. Nam sapien tellus, tempus et, tempus ac, tincidunt
in, arcu. Duis dictum. Proin magna nulla, pellentesque non, commodo
et, iaculis sit amet, mi. Mauris condimentum massa ut metus. Donec
viverra, sapien mattis rutrum tristique, lacus eros semper tellus, et
molestie nisi sapien eu massa. Vestibulum ante ipsum primis in
faucibus orci luctus et ultrices posuere cubilia Curae; Fusce erat
tortor, mollis ut, accumsan ut, lacinia gravida, libero. Curabitur
massa felis, accumsan feugiat, convallis sit amet, porta vel, neque.
Duis et ligula non elit ultricies rutrum. Suspendisse tempor.
EOS
    words.gsub!(/\n/,' ')
    words
end

class PostsController < ApplicationController
    def create_lots_of_test_posts(params)
        (1...40).each do |i|
            post = current_user.posts.build(
                :content => generate_random_content,
                :post_index => Post.find(:all,
                    :conditions => ["msg_thread_id = ?",
                                    params[:thread]]).last.post_index + 1)

            post.reply_user_id = params[:reply_to].to_i
            post.msg_thread_id = params[:thread].to_i
            post.reply_index = params[:reply_index].to_i
            post.save
        end
    end

    def index
        post_array = []
        thread = MsgThread.find(params[:thread])
        thread.posts.all(
            :order => "id",
            :include => [:user, :reply_user]).each do |post|

            post_array.push get_post_info(post)
        end

        result = {
            :posts => post_array,
            :count => thread.posts.length
        }
        render :json => result.to_json
    end

    def create
        if params[:textData] == "DOTEST"
            create_lots_of_test_posts params
        end

        thread = MsgThread.find(params[:thread])

        post = current_user.posts.build(
            :content => params[:textData],
            :post_index => thread.posts.last.post_index + 1,
            :reply_index => params[:reply_index].to_i,
            :msg_thread => thread,
            :reply_user_id => params[:reply_to].to_i
        )

        post.save

        render :json => get_post_info(post)
    end

    def show
        post = Post.find(params[:id])
        render :json => get_post_info(post).to_json
    end

    def destroy
        post = Post.find(params[:id])

        if post.user.id != current_user.id and not current_user.admin?
            return render :text => "WRONG_USER"
        end

        if post.post_index == 0
            thread = MsgThread.find(post.msg_thread_id)
            allposts = Post.find(:all,
                                 :conditions => ["msg_thread_id = ?",
                                                 post.msg_thread_id])
            allposts.each do |eachpost|
                eachpost.destroy
            end

            thread.destroy
            render :json => nil
        else
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

        if post.user.id != current_user.id and not current_user.admin?
            return render :text => "WRONG_USER"
        end

        post.content = params[:textData]
        post.save

        render :json => get_post_info(post).to_json
    end
end
