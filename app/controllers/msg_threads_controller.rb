def get_folder_info(folder)
    { :name => folder.name,
      :id => folder.id,
      :threads => [] }
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
      :post_count => thread.post_count }
end

class MsgThreadsController < ApplicationController
    def  index
        q_folders = Folder.all
        folders = []
        q_folders.each do |folder|
            folders.push get_folder_info(folder)
            threads = MsgThread.all :conditions => ["folder_id = ?", folder.id]
            threads.each do |thread|
                folders.last[:threads].push get_thread_info(thread)
            end
        end

        folders.push :name => "Uncategorised", :id => 0, :threads => []
        threads = MsgThread.all :conditions => "folder_id < 1"
        threads.each do |thread|
            folders.last[:threads].push get_thread_info(thread)
        end

        render :json => folders.to_json
    end

    def create
        user = current_user #User.find(params[:from].to_i)

        thread = user.msg_threads.build(
            :title => params[:title],
            :folder_id => params[:folder],
            :first_post => user.posts.build(
                :content => params[:textData],
                :post_index => 0,
                :reply_index => 0,
                :reply_user_id => 0))
        thread.save

        render :json => get_post_info(thread.first_post).to_json
    end

end
