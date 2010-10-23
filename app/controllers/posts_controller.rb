def get_user_info(user)
    if user
        { :name => "testname", #user.name,
          :id => user.id
        }
    else
        { :name => "(all)",
          :id => 0
        }
    end
end

def get_post_info(post)
    { :from => get_user_info(post.user),
      :to_index => post.reply_index,
      :to_user => get_user_info(post.reply_user),
      :date => post.created_at,
      :post_index => post.post_index,
      :body => post.content,
      :sig => post.user.sig,
      :thread => post.msg_thread.id,
    }
end

class PostsController < ApplicationController
    def index
        posts = Post.find(:all,
                          :conditions => ["msg_thread_id = ?",
                                          params[:thread]],
                          :include => [ :user, :reply_user ] )
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
        post = Post.new()
        post.content = params[:msg]
        post.user_id = params[:reply_from].to_i
        post.reply_user_id = params[:reply_to].to_i
        post.msg_thread_id = params[:thread].to_i
        post.post_index = params[:post_index].to_i
        post.reply_index = params[:reply_index].to_i
        post.save
        render :json => get_post_info(post)
    end
end
