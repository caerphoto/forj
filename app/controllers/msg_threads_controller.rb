def get_folder_info(folder)
    { :name => folder.name,
      :id => folder.id,
      :threads => [],
      :thread_count => folder.msg_threads.length }
end

def get_thread_info(thread)
    if thread.folder.nil?
        f = 0
    else 
        f = thread.folder.id
    end

    { :title => thread.title,
      :id => thread.id,
      :folder_id => f,
      :post_count => thread.posts.length }
end

def reset_folder_ids
  MsgThread.all.each do |thread|
      thread.folder_id = 0
      thread.save
  end
end

class MsgThreadsController < ApplicationController
    def  index
        folders = Folder.all(
            :order => "updated_at",
            :include => :msg_threads)
        result = []
        folders.each do |folder|
            result.push get_folder_info(folder)
            folder.msg_threads.each do |thread|
                result.last[:threads].push get_thread_info(thread)
            end
        end

        threads = MsgThread.all :conditions => "folder_id = 0"
        result.push :name => "Uncategorised", :id => 0, :threads => [],
            :thread_count => threads.length
        threads.each do |thread|
            result.last[:threads].push get_thread_info(thread)
        end

        render :json => result.to_json
    end

    def create
        thread = current_user.msg_threads.build(
            :title => params[:title],
            :folder_id => params[:folder].to_i,
            :first_post => current_user.posts.build(
                :content => params[:textData],
                :post_index => 0,
                :reply_index => 0,
                :reply_user_id => 0
            )
        )
        thread.save

        render :json => get_post_info(thread.first_post).to_json
    end

end
