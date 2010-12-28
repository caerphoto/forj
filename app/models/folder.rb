class Folder < ActiveRecord::Base
    has_many :msg_threads

    # Move all of the folder's threads to the 'Uncategorised' folder
    before_destroy do |folder|
        folder.msg_threads.all.each do |thread|
            thread.folder_id = 0;
            thread.save
        end
    end

    def to_h
        {
            :name => self.name,
            :id => self.id,
            :threads => [],
            :thread_count => self.msg_threads.length
        }
    end
end
