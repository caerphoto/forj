def reset_folder_ids
  # Not necessary any more - a leftover from before I'd implemented folders
  MsgThread.all.each do |thread|
      thread.folder_id = 0
      thread.save
  end
end

def user_clearance
    clearance = 0
    if user_signed_in?
        clearance += 1
        clearance += current_user.rank
    end
    return clearance
end

def get_folder_info(folder)
    { :name => folder.name,
      :id => folder.id,
      :threads => [],
      :thread_count => folder.msg_threads.length }
end

class MsgThreadsController < ApplicationController
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

        unread_count = thread.posts.length - last_read
        unread_count = 0 if unread_count < 0

        { :title => thread.title,
          :id => thread.id,
          :folder_id => f,
          :unread_count => unread_count,
          :post_count => thread.posts.length }
    end

    def index
        result = []

        folders = Folder.all(
            :order => "updated_at DESC",
            :include => :msg_threads,
            :conditions => "clearance <= #{user_clearance}")

        # Add each folder, and for each folder, add info for its threads
        folders.each do |folder|
            f = get_folder_info(folder)

            folder.msg_threads.all(
                :order => "updated_at DESC"
            ).each do |thread|
                f[:threads].push get_thread_info(thread)
            end

            result.push f
        end

        # Add 'Uncategorised' threads. Once FORJ is production-ready this won't
        # be necessary.
        threads = MsgThread.all(
            :conditions => "folder_id = 0",
            :order => "updated_at DESC")
        result.push :name => "Uncategorised", :id => 0, :threads => [],
            :thread_count => threads.length
        threads.each do |thread|
            result.last[:threads].push get_thread_info(thread)
        end

        render :json => result.to_json
    end

    def create
        folder = Folder.find(params[:folder])
        # Put the new thread in 'Uncategorised' if user does not have
        # sufficient clearance to post in the given folder. This is a security
        # precaution, since on client side the user won't even see folders to
        # which they don't have access, but it prevents access via query
        # string manipulation.
        if folder.clearance > user_clearance
            thread = MsgThreads.build(
                :title => params[:title],
                :folder_id => 0
            )
        else
            thread = folder.msg_threads.build(
                :title => params[:title]
            )
        end

        create_post thread, :content => params[:textData]

        thread.save

        render :json => get_post_info(thread.posts.first).to_json
    end

    def destroy
        thread = MsgThread.find(params[:id])
        thread.destroy
        render :text => ""
    end

end
