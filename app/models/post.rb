class Post < ActiveRecord::Base
    include CommonFunctions

    belongs_to :user
    belongs_to :reply_user, :class_name => "User"
    belongs_to :msg_thread

    after_create :timestamp_thread
    after_save :timestamp_thread

    def to_h
        {
            :from => self.user.nil? ?
                nil : self.user.to_h_basic,
            :to_index => self.reply_index,
            :to_user => self.reply_user.nil? ?
                nil : self.reply_user.to_h_basic,
            :date => format_date(self.created_at),
            :post_index => self.post_index,
            :body => self.content,
            :thread => self.msg_thread_id,
            :id => self.id
        }
    end

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
