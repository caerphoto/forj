class Folder < ActiveRecord::Base
    has_many :msg_threads

    # Move all of the folder's threads to the 'Uncategorised' folder
    before_destroy do |folder|
        folder.msg_threads.all.each do |thread|
            thread.folder_id = 0;
            thread.save
        end
    end
end
