def get_thread_info(thread)
    { :title => thread.title,
      :id => thread.id,
      :post_count => thread.post_count,
      :started_by => thread.user.name }
end

class MsgThreadsController < ApplicationController
    def  index
        threads = MsgThread.find(:all,
                                 :limit => 10,
                                 :include => :user);
        threads_array = []
        threads.each do |thread|
            threads_array.push get_thread_info(thread)
        end

        render :json => threads_array.to_json
    end
end
            "&reply_from=", FORJ.ui.selReplyFrom.val(),
            "&thread=", post_data.thread,
            "&reply_index=", post_data.post_index,
            "&msg=", encodeURIComponent(FORJ.ui.replybox.find("textarea").
                val()),
            "&post_index=1" // for now at least
