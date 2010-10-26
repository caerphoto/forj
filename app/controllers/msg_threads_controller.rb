def get_thread_info(thread)
    { :title => thread.title,
      :id => thread.id,
      :post_count => thread.post_count }
end

class MsgThreadsController < ApplicationController
    def  index
        threads = MsgThread.find(:all,
                                 :limit => 10)
        threads_array = []
        threads.each do |thread|
            threads_array.push get_thread_info(thread)
        end

        render :json => threads_array.to_json
    end

    def create
        user = current_user #User.find(params[:from].to_i)

        thread = user.msg_threads.build(
            :title => params[:title],
            :first_post => user.posts.build(
                :content => params[:textData],
                :post_index => 0,
                :reply_index => 0,
                :reply_user_id => 0))
        thread.save

        render :json => get_post_info(thread.first_post).to_json
    end

end
