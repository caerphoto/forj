class Post < ActiveRecord::Base
    belongs_to :user
    belongs_to :reply_user, :class_name => "User"
    belongs_to :msg_thread

    after_create :timestamp_thread
    after_save :timestamp_thread

    private
    # Ensure folder is marked as updated when a new thread is added to it, so
    # folders can be sorted properly
    def timestamp_thread
        msg_thread.update_attribute(:updated_at, Time.now)
        f = msg_thread.folder
        unless f.nil?
            f.update_attribute(:updated_at, Time.now)
        end
    end
end
