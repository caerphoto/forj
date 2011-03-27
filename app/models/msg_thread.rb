class MsgThread < ActiveRecord::Base
    has_many :posts
    belongs_to :folder
    validates :title, :presence => true

    after_create :timestamp_folder

    before_destroy do |thread|
        # This does not work, it just sets each of the posts' msg_thread_id to
        # null:
        #thread.posts.delete_all
        Post.delete_all "msg_thread_id = #{thread.id}"
    end

    def to_h last_read_s = ""
        # The last read string needs to be passed as a parameter because the
        # Devise current_user helper is not accessible from here (unless I'm
        # doing something wrong)
        f_id = self.folder.nil? ? 0 : self.folder.id

        last_read = 0
        if last_read_s
            # Extract the number of posts the user has read in this thread, if
            # possible
            m = last_read_s.match(/(^|,)#{self.id}:(\d+)(,|$)/)
            if m
                last_read = m[2].to_i
            else
                last_read = 0
            end
        end

        unread_count = self.posts.length - last_read
        unread_count = 0 if unread_count < 0

        { :title => self.title,
          :id => self.id,
          :folder_id => f_id,
          :unread_count => unread_count,
          :post_count => self.posts.length }
    end

    private
    # Ensure folder is marked as updated when a new thread is added to it, so
    # folders can be sorted properly
    def timestamp_folder
        unless folder.nil?
            folder.update_attribute(:updated_at, Time.now)
        end
    end
end
