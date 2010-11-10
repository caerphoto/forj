class MsgThread < ActiveRecord::Base
    has_many :posts
    has_one :first_post, :class_name => "Post", :conditions => "post_index = 0"
    belongs_to :user
    belongs_to :folder
    validates :title, :presence => true

    before_destroy do |thread|
        # This does not work, it just sets each of the posts' msg_thread_id to
        # null:
        #thread.posts.delete_all
        Post.delete_all "msg_thread_id = #{thread.id}"
    end
end
