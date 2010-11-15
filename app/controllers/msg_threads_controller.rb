def reset_folder_ids
  # Not necessary any more - a leftover from before I'd implemented folders
  MsgThread.all.each do |thread|
      thread.folder_id = 0
      thread.save
  end
end

class MsgThreadsController < ApplicationController
    def get_folder_info(folder)
        { :name => folder.name,
          :id => folder.id,
          :threads => [],
          :thread_count => folder.msg_threads.length }
    end

    def get_thread_info(thread)
        f = thread.folder.nil? ? 0 : thread.folder.id

        last_read = 0
        if user_signed_in? and current_user.last_read
            # Extract the number of posts the user has read in this thread, if
            # possible
            m = current_user.last_read.match(/(^|,)#{thread.id}:(\d+)(,|$)/)
            if m
                last_read = m[2].to_i
            else
                last_read = 0
            end
        end

        { :title => thread.title,
          :id => thread.id,
          :folder_id => f,
          :unread_count => thread.posts.length - last_read,
          :post_count => thread.posts.length }
    end

    def  index
        result = {
            # last_read data is pushed to the JS so it can be dealt with there
            # in real-time, allowing the user easy selection of different
            # thread views ('Unread Only', 'Interesting' etc).
            :folders => []
        }

        folders = Folder.all(
            :order => "updated_at DESC",
            :include => :msg_threads)

        # Add each folder, and for each folder, add info for its threads
        folders.each do |folder|
            f = get_folder_info(folder)

            folder.msg_threads.all(
                :order => "updated_at DESC"
            ).each do |thread|
                f[:threads].push get_thread_info(thread)
            end

            result[:folders].push f
        end

        # Add 'Uncategorised' threads. Once FORJ is production-ready this won't
        # be necessary.
        threads = MsgThread.all(
            :conditions => "folder_id = 0",
            :order => "updated_at DESC")
        result[:folders].push :name => "Uncategorised", :id => 0, :threads => [],
            :thread_count => threads.length
        threads.each do |thread|
            result[:folders].last[:threads].push get_thread_info(thread)
        end

        render :json => result.to_json
    end

    def create
        thread = Folder.find(params[:folder]).msg_threads.build(
            :title => params[:title],
            :user_id => current_user.id
        )
        thread.posts.build(
            :content => params[:textData],
            :user_id => thread.user_id,
            :post_index => 0,
            :reply_index => 0,
            :reply_user_id => 0
        )
        thread.save

        render :json => get_post_info(thread.posts.first).to_json
    end

    def destroy
        thread = MsgThread.find(params[:id])
        thread.destroy
        render :text => ""
    end

end
