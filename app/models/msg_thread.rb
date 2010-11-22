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

    private
    # Ensure folder is marked as updated when a new thread is added to it, so
    # folders can be sorted properly
    def timestamp_folder
        folder.update_attribute(:updated_at, Time.now)
    end
end
