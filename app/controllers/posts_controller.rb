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

class PostsController < ApplicationController
    def index
        posts = Post.find(:all,
                          :conditions => ["msg_thread_id = ?",
                                          params[:thread]])
        post_array = []
        posts.each do |post|
            post_array.push get_post_info(post)
        end

        result = {
            :posts => post_array,
            :count => posts.length
        }
        render :json => result.to_json

    end

    def create
        user = current_user #User.find(params[:reply_from].to_i)
        post = user.posts.build(
            :content => params[:textData],
            :post_index => Post.find(:all,
                :conditions => ["msg_thread_id = ?",
                                params[:thread]]).last.post_index + 1)

        post.reply_user_id = params[:reply_to].to_i
        post.msg_thread_id = params[:thread].to_i
        post.reply_index = params[:reply_index].to_i
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
end
