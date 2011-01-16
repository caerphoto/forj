class MsgThreadsController < ApplicationController
    def index
        result = []

        if user_signed_in?
            user_clearance = current_user.rank
        else
            user_clearance = 0
        end

        folders = Folder.all(
            :order => "updated_at DESC",
            :include => :msg_threads,
            :conditions => "clearance <= #{user_clearance}")

        last_read = user_signed_in? ? current_user.last_read : ""
        # Add each folder, and for each folder, add info for its threads
        folders.each do |folder|
            f = folder.to_h

            folder.msg_threads.all(
                :order => "updated_at DESC"
            ).each do |thread|
                f[:threads].push thread.to_h last_read
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

        # Need to make a class variable available because the user_signed_in?
        # and current_user helpers are not accessible from within model methods
        threads.each do |thread|
            result.last[:threads].push thread.to_h last_read
        end

        render :json => result.to_json
    end

    def create
        folder = Folder.exists?(params[:folder]) ? Folder.find(params[:folder]) : nil
        # Put the new thread in 'Uncategorised' if user does not have
        # sufficient clearance to post in the given folder. This is a security
        # precaution, since on client side the user won't even see folders to
        # which they don't have access, but it prevents access via query
        # string manipulation.
        if folder.nil? or folder.clearance > user_clearance
            thread = MsgThread.create(
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

        render :json => thread.posts.first.to_h.to_json
    end

    def destroy
        thread = MsgThread.find(params[:id])
        thread.destroy
        render :text => ""
    end

end
